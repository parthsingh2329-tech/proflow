import { Task, TaskDependency } from '@/types';
import { differenceInDays, addDays } from 'date-fns';

export interface CPMResult {
  tasks: Task[];
  criticalPathTaskIds: Set<string>;
  projectDurationDays: number;
}

/**
 * Validates if adding a dependency (predecessorId -> successorId) would create a cycle in the task graph.
 */
export function wouldCreateCycle(predecessorId: string, successorId: string, tasks: Task[]): boolean {
  if (predecessorId === successorId) return true;

  // Build adjacency map: predecessor -> successors
  const adj = new Map<string, string[]>();
  tasks.forEach((t) => {
    const succs = (t.dependenciesAsPredecessor || []).map((d) => d.successorId);
    adj.set(t.id, succs);
  });

  // Adding predecessorId -> successorId creates a cycle if successorId can already reach predecessorId
  const visited = new Set<string>();
  const stack = [successorId];

  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (curr === predecessorId) return true; // Cycle detected!

    if (!visited.has(curr)) {
      visited.add(curr);
      const nextNodes = adj.get(curr) || [];
      for (const next of nextNodes) {
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }
  }

  return false;
}

/**
 * Calculates Critical Path Method (CPM) metrics (ES, EF, LS, LF, Slack)
 * across tasks with FS, SS, FF, SF relationships.
 * Incorporates full DAG cycle purification to permanently prevent schedule corruption.
 */
export function calculateCriticalPath(tasks: Task[]): CPMResult {
  if (!tasks || tasks.length === 0) {
    return { tasks: [], criticalPathTaskIds: new Set(), projectDurationDays: 0 };
  }

  const validDates = tasks
    .map((t) => {
      const d = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      return isNaN(d.getTime()) ? null : d.getTime();
    })
    .filter((d): d is number => d !== null);

  const earliestProjectStart = new Date(validDates.length > 0 ? Math.min(...validDates) : Date.now());

  const taskMap = new Map<string, Task & { duration: number; es: number; ef: number; ls: number; lf: number; slack: number }>();

  // Initialize node durations & base start offsets in days
  tasks.forEach((task) => {
    let start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    let end = task.dueDate ? new Date(task.dueDate) : addDays(start, task.isMilestone ? 0 : 3);
    if (isNaN(start.getTime())) start = earliestProjectStart;
    if (isNaN(end.getTime())) end = addDays(start, task.isMilestone ? 0 : 3);

    const baseOffset = Math.max(0, differenceInDays(start, earliestProjectStart));
    const duration = task.isMilestone ? 0 : Math.max(1, differenceInDays(end, start) + 1);

    taskMap.set(task.id, {
      ...task,
      duration,
      es: baseOffset,
      ef: baseOffset + duration,
      ls: Infinity,
      lf: Infinity,
      slack: 0,
    });
  });

  // DAG Cycle Purification: Build a strictly acyclic dependency graph
  const sanitizedSuccessors = new Map<string, TaskDependency[]>();
  const sanitizedPredecessors = new Map<string, TaskDependency[]>();
  const currentDagAdj = new Map<string, string[]>();

  const canReachInDag = (fromId: string, toId: string): boolean => {
    if (fromId === toId) return true;
    const visited = new Set<string>();
    const stack = [fromId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (curr === toId) return true;
      if (!visited.has(curr)) {
        visited.add(curr);
        const nexts = currentDagAdj.get(curr) || [];
        for (const next of nexts) {
          if (!visited.has(next)) stack.push(next);
        }
      }
    }
    return false;
  };

  tasks.forEach((task) => {
    const deps = task.dependenciesAsSuccessor || [];
    deps.forEach((dep) => {
      const u = dep.predecessorId;
      const v = task.id;
      if (u === v || !taskMap.has(u)) return; // skip self-loops and missing nodes

      // If v can already reach u in our current DAG, adding u -> v closes a cycle!
      if (canReachInDag(v, u)) {
        console.warn(`[CPM Sanitizer] Purged circular dependency edge: ${u} -> ${v}`);
        return; // Drop cyclic edge
      }

      // Safe to insert into DAG
      if (!currentDagAdj.has(u)) currentDagAdj.set(u, []);
      currentDagAdj.get(u)!.push(v);

      if (!sanitizedSuccessors.has(v)) sanitizedSuccessors.set(v, []);
      sanitizedSuccessors.get(v)!.push(dep);

      if (!sanitizedPredecessors.has(u)) sanitizedPredecessors.set(u, []);
      sanitizedPredecessors.get(u)!.push(dep);
    });
  });

  // Forward Pass on Sanitized DAG
  let changed = true;
  let iterations = 0;
  const maxIterations = Math.max(10, tasks.length);

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    tasks.forEach((task) => {
      const node = taskMap.get(task.id);
      if (!node) return;

      const deps = sanitizedSuccessors.get(task.id) || [];
      deps.forEach((dep) => {
        const pred = taskMap.get(dep.predecessorId);
        if (!pred) return;

        const lag = dep.lagDays || 0;
        let candidateES = node.es;

        switch (dep.type) {
          case 'FS': // Finish-to-Start
            candidateES = Math.max(candidateES, pred.ef + lag);
            break;
          case 'SS': // Start-to-Start
            candidateES = Math.max(candidateES, pred.es + lag);
            break;
          case 'FF': // Finish-to-Finish
            candidateES = Math.max(candidateES, pred.ef + lag - node.duration);
            break;
          case 'SF': // Start-to-Finish
            candidateES = Math.max(candidateES, pred.es + lag - node.duration);
            break;
        }

        if (candidateES > node.es) {
          node.es = candidateES;
          node.ef = candidateES + node.duration;
          changed = true;
        }
      });
    });
  }

  // Find maximum project completion time
  let maxEF = 0;
  taskMap.forEach((node) => {
    if (node.ef > maxEF) maxEF = node.ef;
  });

  // Backward Pass on Sanitized DAG
  taskMap.forEach((node) => {
    const hasSuccessors = (sanitizedPredecessors.get(node.id) || []).length > 0;
    if (!hasSuccessors) {
      node.lf = maxEF;
      node.ls = node.lf - node.duration;
    }
  });

  changed = true;
  iterations = 0;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    tasks.forEach((task) => {
      const node = taskMap.get(task.id);
      if (!node) return;

      const successors = sanitizedPredecessors.get(task.id) || [];
      successors.forEach((dep) => {
        const succ = taskMap.get(dep.successorId);
        if (!succ || succ.ls === Infinity) return;

        const lag = dep.lagDays || 0;
        let candidateLF = node.lf;

        switch (dep.type) {
          case 'FS':
            candidateLF = Math.min(candidateLF, succ.ls - lag);
            break;
          case 'SS':
            candidateLF = Math.min(candidateLF, succ.ls - lag + node.duration);
            break;
          case 'FF':
            candidateLF = Math.min(candidateLF, succ.lf - lag);
            break;
          case 'SF':
            candidateLF = Math.min(candidateLF, succ.lf - lag + node.duration);
            break;
        }

        if (candidateLF < node.lf) {
          node.lf = candidateLF;
          node.ls = candidateLF - node.duration;
          changed = true;
        }
      });
    });
  }

  const criticalPathTaskIds = new Set<string>();

  // Compute Slack / Float and assign isCritical
  const enhancedTasks: Task[] = tasks.map((task) => {
    const node = taskMap.get(task.id);
    if (!node) return task;

    const rawSlack = isFinite(node.ls) && isFinite(node.es) ? Math.max(0, node.ls - node.es) : 0;
    const slack = Math.round(rawSlack);
    const isCritical = slack === 0;

    if (isCritical) {
      criticalPathTaskIds.add(task.id);
    }

    return {
      ...task,
      isCritical,
      slack,
      totalFloat: slack,
      earlyStart: addDays(earliestProjectStart, node.es),
      earlyFinish: addDays(earliestProjectStart, node.ef),
      lateStart: isFinite(node.ls) ? addDays(earliestProjectStart, node.ls) : undefined,
      lateFinish: isFinite(node.lf) ? addDays(earliestProjectStart, node.lf) : undefined,
    };
  });

  // Calculate true project horizon span
  const endDates = tasks
    .map((t) => (t.dueDate ? new Date(t.dueDate).getTime() : t.startDate ? new Date(t.startDate).getTime() : null))
    .filter((d): d is number => d !== null && !isNaN(d));

  const horizonDays = endDates.length > 0
    ? Math.max(1, differenceInDays(new Date(Math.max(...endDates)), earliestProjectStart))
    : maxEF;

  return {
    tasks: enhancedTasks,
    criticalPathTaskIds,
    projectDurationDays: horizonDays,
  };
}
