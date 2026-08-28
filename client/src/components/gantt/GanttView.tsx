import React, { useState, useMemo } from 'react';
import { Task, DependencyType, WBSNode } from '@/types';
import { 
  format, 
  differenceInDays, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  isToday,
  isWeekend
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart2, 
  Zap, 
  Diamond, 
  Flag, 
  Link2, 
  Network, 
  ListFilter, 
  FolderTree, 
  ChevronDown, 
  ChevronUp, 
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { calculateCriticalPath } from '@/lib/cpm';
import { useWBS } from '@/hooks/useWBS';

interface GanttViewProps {
  tasks: Task[];
  projectId?: string;
  onTaskClick: (task: Task) => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#8b5cf6',
  DONE: '#10b981',
};

const RELATIONSHIP_LABELS: Record<DependencyType, string> = {
  FS: 'Finish-to-Start (FS)',
  SS: 'Start-to-Start (SS)',
  FF: 'Finish-to-Finish (FF)',
  SF: 'Start-to-Finish (SF)',
};

export default function GanttView({ tasks = [], projectId, onTaskClick }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [viewMode, setViewMode] = useState<'WBS' | 'FLAT'>('WBS');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Fetch WBS hierarchy if projectId is available
  const { data: wbsNodes = [] } = useWBS(projectId);

  // Compute Critical Path Metrics across all project tasks
  const { tasks: cpmTasks, criticalPathTaskIds, projectDurationDays } = useMemo(() => {
    return calculateCriticalPath(tasks);
  }, [tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDaysInMonth = days.length;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedNodes(new Set());
  const collapseAll = () => {
    const allIds = new Set(wbsNodes.map((n) => n.id));
    setCollapsedNodes(allIds);
  };

  // Build WBS hierarchical groups
  const wbsHierarchyRows = useMemo(() => {
    if (viewMode === 'FLAT' || wbsNodes.length === 0) {
      return null;
    }

    // Top-level root nodes
    const rootNodes = wbsNodes.filter((n) => !n.parentNodeId);

    // Map tasks to WBS nodes
    const tasksByWBS = new Map<string, Task[]>();
    const unassignedTasks: Task[] = [];

    cpmTasks.forEach((task) => {
      if (task.wbsNodeId) {
        const existing = tasksByWBS.get(task.wbsNodeId) || [];
        existing.push(task);
        tasksByWBS.set(task.wbsNodeId, existing);
      } else {
        // Fallback: match by title similarity or keywords
        let matched = false;
        for (const node of wbsNodes) {
          if (
            task.title.toLowerCase().includes('inverter') && node.name.toLowerCase().includes('inverter') ||
            task.title.toLowerCase().includes('battery') && node.name.toLowerCase().includes('battery') ||
            task.title.toLowerCase().includes('lidar') && node.name.toLowerCase().includes('sensor') ||
            task.title.toLowerCase().includes('aero') && node.name.toLowerCase().includes('aero') ||
            task.title.toLowerCase().includes('safety') && node.name.toLowerCase().includes('safety') ||
            task.title.toLowerCase().includes('homologation') && node.name.toLowerCase().includes('homologation')
          ) {
            const existing = tasksByWBS.get(node.id) || [];
            existing.push(task);
            tasksByWBS.set(node.id, existing);
            matched = true;
            break;
          }
        }
        if (!matched) {
          unassignedTasks.push(task);
        }
      }
    });

    return { rootNodes, tasksByWBS, unassignedTasks };
  }, [viewMode, wbsNodes, cpmTasks]);

  return (
    <Card className="shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Header Controls */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 p-4 dark:border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Gantt Timeline & CPM Schedule
              </CardTitle>
              {criticalPathTaskIds.size > 0 && (
                <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-[10px] px-1.5 py-0.5">
                  <Zap className="h-3 w-3 mr-1" /> {criticalPathTaskIds.size} on Critical Path
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {format(currentMonth, 'MMMM yyyy')} • Project Span: {projectDurationDays} days
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* View Mode Toggle: WBS Hierarchy vs Flat List */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('WBS')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'WBS'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>WBS Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode('FLAT')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'FLAT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Flat CPM List</span>
            </button>
          </div>

          {viewMode === 'WBS' && wbsNodes.length > 0 && (
            <div className="flex items-center space-x-1">
              <Button onClick={expandAll} variant="outline" size="sm" className="text-[11px] h-8 px-2">
                Expand All
              </Button>
              <Button onClick={collapseAll} variant="outline" size="sm" className="text-[11px] h-8 px-2">
                Collapse All
              </Button>
            </div>
          )}

          {/* Critical Path Toggle */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-lg">
            <Switch
              id="critical-path-toggle"
              checked={showCriticalPath}
              onCheckedChange={setShowCriticalPath}
            />
            <label
              htmlFor="critical-path-toggle"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center space-x-1"
            >
              <Zap className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              <span>Critical Path</span>
            </label>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
            <Button onClick={prevMonth} variant="ghost" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button onClick={goToToday} variant="ghost" size="sm" className="text-xs h-7 px-2">
              Today
            </Button>
            <Button onClick={nextMonth} variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Legend Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-6 rounded bg-slate-800 dark:bg-slate-200 border-b-2 border-indigo-600" />
          <span className="text-slate-600 dark:text-slate-400">WBS Summary Phase Bracket</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-6 rounded bg-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">Standard Task Bar</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-6 rounded bg-rose-500" />
          <span className="text-slate-600 dark:text-slate-400 font-semibold text-rose-600 dark:text-rose-400">Critical Path (Zero Float)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Diamond className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">APQP Milestone Diamond</span>
        </div>
      </div>

      {/* Scrollable Gantt Matrix */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[950px] select-none">
          {/* Header Row: Days of Month */}
          <div
            className="grid bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold sticky top-0 z-20"
            style={{
              gridTemplateColumns: `320px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>{viewMode === 'WBS' ? 'WBS Structure & Deliverables' : 'Task & Milestone Items'} ({cpmTasks.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Slack (Days)</span>
            </div>
            {days.map((day) => {
              const isDayToday = isToday(day);
              const isDayWeekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-1 text-center text-[10px] border-r border-slate-100 dark:border-slate-800/80 flex flex-col justify-center items-center ${
                    isDayToday
                      ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                      : isDayWeekend
                      ? 'bg-slate-100/50 dark:bg-slate-900/60 text-slate-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-[8px] uppercase tracking-wider">{format(day, 'EEE')}</span>
                  <span className="font-semibold text-xs mt-0.5">{format(day, 'd')}</span>
                </div>
              );
            })}
          </div>

          {/* Rows Container */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 relative z-10">
            {viewMode === 'WBS' && wbsHierarchyRows ? (
              // ==========================================
              // WBS HIERARCHY VIEW
              // ==========================================
              wbsHierarchyRows.rootNodes.map((rootNode) => {
                const isCollapsed = collapsedNodes.has(rootNode.id);
                const childNodes = wbsNodes.filter((n) => n.parentNodeId === rootNode.id);

                // Collect all tasks under this root node and its children
                const allNodeIds = [rootNode.id, ...childNodes.map((c) => c.id)];
                const directAndChildTasks: Task[] = [];
                allNodeIds.forEach((id) => {
                  const matched = wbsHierarchyRows.tasksByWBS.get(id) || [];
                  directAndChildTasks.push(...matched);
                });

                // Calculate summary envelope dates for the WBS Phase
                let phaseStart = rootNode.startDate ? new Date(rootNode.startDate) : monthStart;
                let phaseEnd = rootNode.dueDate ? new Date(rootNode.dueDate) : monthEnd;

                if (directAndChildTasks.length > 0) {
                  const taskStartTimes = directAndChildTasks
                    .map((t) => (t.startDate ? new Date(t.startDate).getTime() : null))
                    .filter((t): t is number => t !== null);
                  const taskEndTimes = directAndChildTasks
                    .map((t) => (t.dueDate ? new Date(t.dueDate).getTime() : null))
                    .filter((t): t is number => t !== null);

                  if (taskStartTimes.length > 0) phaseStart = new Date(Math.min(...taskStartTimes));
                  if (taskEndTimes.length > 0) phaseEnd = new Date(Math.max(...taskEndTimes));
                }

                const phaseStartOffset = differenceInDays(phaseStart, monthStart);
                const phaseDuration = Math.max(1, differenceInDays(phaseEnd, phaseStart) + 1);
                const phaseLeftPercent = Math.max(0, Math.min(100, (phaseStartOffset / totalDaysInMonth) * 100));
                const phaseWidthPercent = Math.max(4, Math.min(100 - phaseLeftPercent, (phaseDuration / totalDaysInMonth) * 100));

                return (
                  <React.Fragment key={rootNode.id}>
                    {/* WBS Root Phase Row (Summary Bracket) */}
                    <div
                      className="grid items-center bg-slate-100/70 dark:bg-slate-800/60 font-semibold py-2.5 border-b border-slate-200 dark:border-slate-700"
                      style={{
                        gridTemplateColumns: `320px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
                      }}
                    >
                      {/* Left Phase Title & Expand/Collapse */}
                      <div
                        onClick={() => toggleNodeCollapse(rootNode.id)}
                        className="px-3 text-xs font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                          )}
                          <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                            {rootNode.wbsCode}
                          </span>
                          <span className="truncate">{rootNode.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                          {rootNode.progress}%
                        </span>
                      </div>

                      {/* Right Timeline: Summary Bracket Gantt Bar [=======] */}
                      <div
                        className="relative h-6 flex items-center"
                        style={{ gridColumn: `2 / span ${totalDaysInMonth}` }}
                      >
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-slate-800 dark:bg-slate-200 rounded-sm shadow-sm flex items-center overflow-hidden"
                          style={{
                            left: `${phaseLeftPercent}%`,
                            width: `${phaseWidthPercent}%`,
                          }}
                          title={`WBS Phase: ${rootNode.wbsCode} ${rootNode.name} (${format(phaseStart, 'MMM d')} - ${format(phaseEnd, 'MMM d')})`}
                        >
                          {/* Progress fill */}
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${rootNode.progress}%` }}
                          />
                        </div>
                        {/* Summary Bracket Endpoints */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100"
                          style={{ left: `${phaseLeftPercent}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100"
                          style={{ left: `${phaseLeftPercent + phaseWidthPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Render Child Tasks If Not Collapsed */}
                    {!isCollapsed && (
                      <>
                        {/* Direct Tasks under this root node */}
                        {(wbsHierarchyRows.tasksByWBS.get(rootNode.id) || []).map((task) => (
                          <GanttTaskRow
                            key={task.id}
                            task={task}
                            monthStart={monthStart}
                            monthEnd={monthEnd}
                            totalDaysInMonth={totalDaysInMonth}
                            showCriticalPath={showCriticalPath}
                            criticalPathTaskIds={criticalPathTaskIds}
                            indent="pl-7"
                            onTaskClick={onTaskClick}
                          />
                        ))}

                        {/* Child WBS Deliverables */}
                        {childNodes.map((childNode) => {
                          const childTasks = wbsHierarchyRows.tasksByWBS.get(childNode.id) || [];
                          return (
                            <React.Fragment key={childNode.id}>
                              {/* Sub-deliverable header row */}
                              <div
                                className="grid items-center bg-slate-50/60 dark:bg-slate-900/40 py-1.5 text-xs border-b border-slate-100 dark:border-slate-800"
                                style={{
                                  gridTemplateColumns: `320px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
                                }}
                              >
                                <div className="pl-6 pr-3 flex items-center space-x-2 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium truncate">
                                  <span className="font-mono text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1 py-0.2 rounded">
                                    {childNode.wbsCode}
                                  </span>
                                  <span className="truncate">{childNode.name}</span>
                                </div>
                                <div style={{ gridColumn: `2 / span ${totalDaysInMonth}` }} />
                              </div>

                              {/* Tasks under this child deliverable */}
                              {childTasks.map((task) => (
                                <GanttTaskRow
                                  key={task.id}
                                  task={task}
                                  monthStart={monthStart}
                                  monthEnd={monthEnd}
                                  totalDaysInMonth={totalDaysInMonth}
                                  showCriticalPath={showCriticalPath}
                                  criticalPathTaskIds={criticalPathTaskIds}
                                  indent="pl-10"
                                  onTaskClick={onTaskClick}
                                />
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              // ==========================================
              // FLAT LIST VIEW
              // ==========================================
              cpmTasks.map((task) => (
                <GanttTaskRow
                  key={task.id}
                  task={task}
                  monthStart={monthStart}
                  monthEnd={monthEnd}
                  totalDaysInMonth={totalDaysInMonth}
                  showCriticalPath={showCriticalPath}
                  criticalPathTaskIds={criticalPathTaskIds}
                  indent="pl-3"
                  onTaskClick={onTaskClick}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------
// INDIVIDUAL GANTT TASK ROW COMPONENT
// ----------------------------------------------------
interface GanttTaskRowProps {
  task: Task & { isCritical?: boolean; totalFloat?: number };
  monthStart: Date;
  monthEnd: Date;
  totalDaysInMonth: number;
  showCriticalPath: boolean;
  criticalPathTaskIds: Set<string>;
  indent?: string;
  onTaskClick: (task: Task) => void;
}

function GanttTaskRow({
  task,
  monthStart,
  monthEnd,
  totalDaysInMonth,
  showCriticalPath,
  criticalPathTaskIds,
  indent = 'pl-3',
  onTaskClick,
}: GanttTaskRowProps) {
  let taskStart = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
  let taskEnd = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, task.isMilestone ? 0 : 3);

  if (isNaN(taskStart.getTime())) taskStart = monthStart;
  if (isNaN(taskEnd.getTime())) taskEnd = addDays(taskStart, task.isMilestone ? 0 : 3);

  const startOffsetDays = differenceInDays(taskStart, monthStart);
  const durationDays = task.isMilestone ? 0 : Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalDaysInMonth) * 100));
  const widthPercent = task.isMilestone ? 0 : Math.max(3, Math.min(100 - leftPercent, (durationDays / totalDaysInMonth) * 100));

  const isTaskOnCriticalPath = showCriticalPath && (task.isCritical || criticalPathTaskIds.has(task.id));
  const isMilestone = task.isMilestone || !!task.milestoneId;
  const hasDependencies = (task.dependenciesAsSuccessor?.length ?? 0) > 0 || (task.dependenciesAsPredecessor?.length ?? 0) > 0;

  return (
    <div
      className={`grid items-center transition-colors py-2 ${
        isTaskOnCriticalPath
          ? 'bg-rose-50/30 dark:bg-rose-950/20'
          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
      }`}
      style={{
        gridTemplateColumns: `320px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
      }}
    >
      {/* Left Title & Status Cell */}
      <div
        onClick={() => onTaskClick(task)}
        className={`${indent} pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group`}
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          {isMilestone ? (
            <Diamond className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
          ) : isTaskOnCriticalPath ? (
            <Zap className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          ) : (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_COLORS[task.status] || '#6366f1' }}
            />
          )}
          <span className="truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            {task.title}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {hasDependencies && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono text-slate-400">
              <Link2 className="h-2.5 w-2.5 mr-0.5" />
              {(task.dependenciesAsSuccessor?.length ?? 0) + (task.dependenciesAsPredecessor?.length ?? 0)}
            </Badge>
          )}
          {task.totalFloat !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-1 rounded ${
                task.totalFloat === 0
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
                  : 'text-slate-400'
              }`}
            >
              {task.totalFloat}d
            </span>
          )}
        </div>
      </div>

      {/* Right Timeline Bar */}
      <div
        className="relative h-7 flex items-center"
        style={{ gridColumn: `2 / span ${totalDaysInMonth}` }}
      >
        {isMilestone ? (
          /* Milestone Diamond */
          <div
            onClick={() => onTaskClick(task)}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer z-10 hover:scale-125 transition-transform"
            style={{ left: `${leftPercent}%` }}
            title={`Milestone: ${task.title} (${format(taskStart, 'MMM d, yyyy')})`}
          >
            <div className="h-4 w-4 bg-amber-500 rotate-45 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" />
          </div>
        ) : (
          /* Standard / Critical Task Bar */
          <div
            onClick={() => onTaskClick(task)}
            className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-md shadow-sm cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 overflow-hidden ${
              isTaskOnCriticalPath
                ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-800'
                : 'bg-indigo-500 text-white'
            }`}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: isTaskOnCriticalPath ? '#ef4444' : STATUS_COLORS[task.status] || '#6366f1',
            }}
            title={`${task.title} (${format(taskStart, 'MMM d')} - ${format(taskEnd, 'MMM d')}, ${durationDays} days) | Status: ${task.status}`}
          >
            <span className="text-[9px] font-semibold truncate leading-none drop-shadow">
              {task.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
