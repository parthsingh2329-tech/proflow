import { Task } from '@/types';
import { differenceInDays, addDays } from 'date-fns';

export interface CPMResult {
  tasks: Task[];
  criticalPathTaskIds: Set<string>;
  projectDurationDays: number;
}

/**
 * Calculates Critical Path Method (CPM) metrics (ES, EF, LS, LF, Slack)
 * across tasks with FS, SS, FF, SF relationships.
 */
export function calculateCriticalPath(tasks: Task[]): CPMResult {
  if (!tasks || tasks.length === 0) {
    return { tasks: [], criticalPathTaskIds: new Set(), projectDurationDays: 0 };
  }

  const taskMap = new Map<string, Task & { duration: number; es: number; ef: number; ls: number; lf: number; slack: number }>();
  const earliestProjectStart = new Date(
    Math.min(
      ...tasks.map((t) => {
        const d = t.startDate ? new Date(t.startDate) : t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
        return isNaN(d.getTime()) ? Date.now() : d.getTime();
      })
    )
  );

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

  // Forward Pass (Iterative relaxation to handle all relationships: FS, SS, FF, SF)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < tasks.length * 2) {
    changed = false;
    iterations++;

    tasks.forEach((task) => {
      const node = taskMap.get(task.id);
      if (!node) return;

      const deps = task.dependenciesAsSuccessor || [];
      deps.forEach((dep) => {
        const pred = taskMap.get(dep.predecessorId);
        if (!pred) return;

        const lag = dep.lagDays || 0;
        let candidateES = node.es;

        switch (dep.type) {
          case 'FS': // Finish-to-Start: Successor starts after Predecessor finishes
            candidateES = Math.max(candidateES, pred.ef + lag);
            break;
          case 'SS': // Start-to-Start: Successor starts after Predecessor starts
            candidateES = Math.max(candidateES, pred.es + lag);
            break;
          case 'FF': // Finish-to-Finish: Successor finishes after Predecessor finishes
            candidateES = Math.max(candidateES, pred.ef + lag - node.duration);
            break;
          case 'SF': // Start-to-Finish: Successor finishes after Predecessor starts
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

  // Backward Pass
  // Initialize terminal nodes
  taskMap.forEach((node) => {
    const hasSuccessors = (node.dependenciesAsPredecessor || []).length > 0;
    if (!hasSuccessors) {
      node.lf = maxEF;
      node.ls = node.lf - node.duration;
    }
  });

  changed = true;
  iterations = 0;
  while (changed && iterations < tasks.length * 2) {
    changed = false;
    iterations++;

    tasks.forEach((task) => {
      const node = taskMap.get(task.id);
      if (!node) return;

      const successors = task.dependenciesAsPredecessor || [];
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

  return {
    tasks: enhancedTasks,
    criticalPathTaskIds,
    projectDurationDays: maxEF,
  };
}
