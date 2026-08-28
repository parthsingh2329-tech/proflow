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
  Link2, 
  Network, 
  ListFilter, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon,
  Maximize2,
  Minimize2,
  FolderOpen
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

export default function GanttView({ tasks = [], projectId, onTaskClick }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-03-01'));
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [viewMode, setViewMode] = useState<'WBS' | 'FLAT'>('WBS');
  const [zoomMode, setZoomMode] = useState<'FULL_PROJECT' | 'MONTH'>('FULL_PROJECT');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Fetch the EXACT live WBS tree from backend
  const { data: wbsTree = [] } = useWBS(projectId);

  // Compute Critical Path Metrics across all project tasks
  const { tasks: cpmTasks, criticalPathTaskIds, projectDurationDays } = useMemo(() => {
    return calculateCriticalPath(tasks);
  }, [tasks]);

  // Determine full project time horizon
  const { projectStartDate, projectEndDate, timelineDays } = useMemo(() => {
    let minDate = new Date('2026-01-10');
    let maxDate = new Date('2026-11-30');

    if (cpmTasks.length > 0) {
      const startTimes = cpmTasks
        .map((t) => (t.startDate ? new Date(t.startDate).getTime() : t.dueDate ? new Date(t.dueDate).getTime() : null))
        .filter((t): t is number => t !== null && !isNaN(t));
      const endTimes = cpmTasks
        .map((t) => (t.dueDate ? new Date(t.dueDate).getTime() : t.startDate ? new Date(t.startDate).getTime() : null))
        .filter((t): t is number => t !== null && !isNaN(t));

      if (startTimes.length > 0) minDate = startOfMonth(new Date(Math.min(...startTimes)));
      if (endTimes.length > 0) maxDate = endOfMonth(new Date(Math.max(...endTimes)));
    }

    if (zoomMode === 'MONTH') {
      minDate = startOfMonth(currentMonth);
      maxDate = endOfMonth(currentMonth);
    }

    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    return { projectStartDate: minDate, projectEndDate: maxDate, timelineDays: days };
  }, [cpmTasks, zoomMode, currentMonth]);

  const totalTimelineDays = timelineDays.length;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

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
    const allIds = new Set<string>();
    const collectIds = (nodes: WBSNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children) collectIds(n.children);
      });
    };
    collectIds(wbsTree);
    setCollapsedNodes(allIds);
  };

  // Helper to match tasks to WBS nodes
  const getTasksForWBSNode = (node: WBSNode): (Task & { isCritical?: boolean; totalFloat?: number })[] => {
    return cpmTasks.filter((t) => {
      if (t.wbsNodeId === node.id || t.wbsNode?.id === node.id) return true;
      if (t.wbsNode?.wbsCode === node.wbsCode) return true;

      // Match by title keywords
      const titleLower = t.title.toLowerCase();
      const nodeNameLower = node.name.toLowerCase();
      const nodeCode = node.wbsCode;

      if (nodeCode === '1.1.1' && (titleLower.includes('inverter') || titleLower.includes('power stage'))) return true;
      if (nodeCode === '1.1.2' && titleLower.includes('gate driver')) return true;
      if (nodeCode === '1.2.1' && (titleLower.includes('immersion') || titleLower.includes('fluid') || titleLower.includes('bms'))) return true;
      if (nodeCode === '1.2.2' && (titleLower.includes('crush') || titleLower.includes('enclosure') || titleLower.includes('structural'))) return true;
      if (nodeCode === '2.1.1' && (titleLower.includes('camera') || titleLower.includes('calibration'))) return true;
      if (nodeCode === '2.1.2' && (titleLower.includes('point cloud') || titleLower.includes('fusion'))) return true;
      if (nodeCode === '2.2.1' && titleLower.includes('suspension')) return true;
      if (nodeCode === '2.2.2' && (titleLower.includes('torque') || titleLower.includes('esc'))) return true;
      if (nodeCode === '3.1.1' && (titleLower.includes('giga') || titleLower.includes('press') || titleLower.includes('casting'))) return true;
      if (nodeCode === '3.1.2' && (titleLower.includes('takt') || titleLower.includes('assembly'))) return true;
      if (nodeCode === '4.1.1' && titleLower.includes('26262')) return true;
      if (nodeCode === '4.1.2' && titleLower.includes('gate 1')) return true;
      if (nodeCode === '4.1.3' && (titleLower.includes('ncap') || titleLower.includes('unece') || titleLower.includes('homologation'))) return true;

      return false;
    });
  };

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
              <Badge variant="outline" className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {cpmTasks.length} Activities Total
              </Badge>
              {criticalPathTaskIds.size > 0 && (
                <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-[10px] px-1.5 py-0.5">
                  <Zap className="h-3 w-3 mr-1" /> {criticalPathTaskIds.size} on Critical Path
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Project Span: {format(projectStartDate, 'MMM d, yyyy')} → {format(projectEndDate, 'MMM d, yyyy')} ({projectDurationDays} days)
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Zoom Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setZoomMode('FULL_PROJECT')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                zoomMode === 'FULL_PROJECT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Project Horizon</span>
            </button>
            <button
              onClick={() => setZoomMode('MONTH')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                zoomMode === 'MONTH'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Month Zoom</span>
            </button>
          </div>

          {/* View Mode Switcher */}
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

          {viewMode === 'WBS' && (
            <div className="flex items-center space-x-1">
              <Button onClick={expandAll} variant="outline" size="sm" className="text-[11px] h-7 px-2">
                Expand All
              </Button>
              <Button onClick={collapseAll} variant="outline" size="sm" className="text-[11px] h-7 px-2">
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

          {/* Month Navigation in Zoom Mode */}
          {zoomMode === 'MONTH' && (
            <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
              <Button onClick={prevMonth} variant="ghost" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-200">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button onClick={nextMonth} variant="ghost" size="icon" className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Legend Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-6 rounded bg-slate-800 dark:bg-slate-200 border-b-2 border-indigo-600" />
            <span className="text-slate-600 dark:text-slate-400">WBS Phase Summary Bracket</span>
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

        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Live WBS Tree ↔ Kanban Task Integration
        </span>
      </div>

      {/* Scrollable Gantt Matrix */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[1100px] select-none">
          {/* Header Row: Days & Months */}
          <div
            className="grid bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold sticky top-0 z-20"
            style={{
              gridTemplateColumns: `360px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>{viewMode === 'WBS' ? 'WBS Structure & Linked Kanban Tasks' : 'All Project Activities'} ({cpmTasks.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Slack</span>
            </div>

            {timelineDays.map((day, idx) => {
              const isDayToday = isToday(day);
              const isFirstOfMonth = day.getDate() === 1 || idx === 0;
              return (
                <div
                  key={day.toISOString()}
                  className={`p-0.5 text-center text-[9px] border-r border-slate-100 dark:border-slate-800/60 flex flex-col justify-center items-center overflow-hidden ${
                    isDayToday
                      ? 'bg-indigo-100/80 font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                      : isFirstOfMonth
                      ? 'bg-indigo-50/50 dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400'
                      : isWeekend(day)
                      ? 'bg-slate-100/40 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title={format(day, 'EEE, MMM d, yyyy')}
                >
                  {isFirstOfMonth ? (
                    <span className="text-[8px] font-bold uppercase truncate">{format(day, 'MMM')}</span>
                  ) : zoomMode === 'MONTH' ? (
                    <span className="text-[7px] uppercase">{format(day, 'EEE')[0]}</span>
                  ) : null}
                  <span className="font-semibold text-[10px] leading-tight">{format(day, 'd')}</span>
                </div>
              );
            })}
          </div>

          {/* Rows Container */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 relative z-10">
            {viewMode === 'WBS' && wbsTree.length > 0 ? (
              // ==========================================
              // LIVE WBS TREE FROM BACKEND
              // ==========================================
              wbsTree.map((phaseNode) => {
                const isPhaseCollapsed = collapsedNodes.has(phaseNode.id);
                const deliverables = phaseNode.children || [];

                // Calculate summary start & end date for the Phase
                const phaseStart = phaseNode.startDate ? new Date(phaseNode.startDate) : projectStartDate;
                const phaseEnd = phaseNode.dueDate ? new Date(phaseNode.dueDate) : projectEndDate;
                const phaseStartOffset = differenceInDays(phaseStart, projectStartDate);
                const phaseDuration = Math.max(1, differenceInDays(phaseEnd, phaseStart) + 1);
                const phaseLeftPercent = Math.max(0, Math.min(100, (phaseStartOffset / totalTimelineDays) * 100));
                const phaseWidthPercent = Math.max(2, Math.min(100 - phaseLeftPercent, (phaseDuration / totalTimelineDays) * 100));

                return (
                  <React.Fragment key={phaseNode.id}>
                    {/* WBS Phase 1.0 Row (Summary Bracket) */}
                    <div
                      className="grid items-center bg-slate-100/90 dark:bg-slate-800/80 font-bold py-2.5 border-b border-slate-200 dark:border-slate-700"
                      style={{
                        gridTemplateColumns: `360px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
                      }}
                    >
                      {/* Left Phase Title */}
                      <div
                        onClick={() => toggleNodeCollapse(phaseNode.id)}
                        className="px-3 text-xs font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span className="p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600">
                            {isPhaseCollapsed ? (
                              <ChevronRightIcon className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0" />
                            )}
                          </span>
                          <span className="font-mono text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                            {phaseNode.wbsCode}
                          </span>
                          <span className="truncate">{phaseNode.name}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {phaseNode.progress}%
                        </span>
                      </div>

                      {/* Right Timeline: Summary Bracket Gantt Bar [=======] */}
                      <div
                        className="relative h-6 flex items-center"
                        style={{ gridColumn: `2 / span ${totalTimelineDays}` }}
                      >
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-slate-800 dark:bg-slate-200 rounded-sm shadow-sm flex items-center overflow-hidden z-10"
                          style={{
                            left: `${phaseLeftPercent}%`,
                            width: `${phaseWidthPercent}%`,
                          }}
                          title={`WBS Phase ${phaseNode.wbsCode} ${phaseNode.name} (${format(phaseStart, 'MMM d')} - ${format(phaseEnd, 'MMM d')}, ${phaseNode.progress}% complete)`}
                        >
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${phaseNode.progress}%` }}
                          />
                        </div>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100 z-10"
                          style={{ left: `${phaseLeftPercent}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100 z-10"
                          style={{ left: `${phaseLeftPercent + phaseWidthPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Deliverables & Work Packages If Not Collapsed */}
                    {!isPhaseCollapsed &&
                      deliverables.map((deliv) => {
                        const isDelivCollapsed = collapsedNodes.has(deliv.id);
                        const workPackages = deliv.children || [];

                        return (
                          <React.Fragment key={deliv.id}>
                            {/* Deliverable 1.1 Row */}
                            <div
                              className="grid items-center bg-slate-50/70 dark:bg-slate-900/50 py-1.5 text-xs border-b border-slate-100 dark:border-slate-800"
                              style={{
                                gridTemplateColumns: `360px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
                              }}
                            >
                              <div
                                onClick={() => toggleNodeCollapse(deliv.id)}
                                className="pl-6 pr-3 flex items-center justify-between border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <div className="flex items-center space-x-1.5 truncate">
                                  {isDelivCollapsed ? (
                                    <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="font-mono text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded font-bold">
                                    {deliv.wbsCode}
                                  </span>
                                  <span className="truncate">{deliv.name}</span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500">{deliv.progress}%</span>
                              </div>
                              <div style={{ gridColumn: `2 / span ${totalTimelineDays}` }} />
                            </div>

                            {/* Work Packages & Linked Kanban Tasks */}
                            {!isDelivCollapsed &&
                              workPackages.map((wp) => {
                                const matchingTasks = getTasksForWBSNode(wp);

                                return (
                                  <React.Fragment key={wp.id}>
                                    {matchingTasks.length > 0 ? (
                                      matchingTasks.map((task) => (
                                        <GanttTaskRow
                                          key={task.id}
                                          task={task}
                                          wbsChildCode={wp.wbsCode}
                                          projectStartDate={projectStartDate}
                                          totalTimelineDays={totalTimelineDays}
                                          showCriticalPath={showCriticalPath}
                                          criticalPathTaskIds={criticalPathTaskIds}
                                          zoomMode={zoomMode}
                                          indent="pl-11"
                                          onTaskClick={onTaskClick}
                                        />
                                      ))
                                    ) : (
                                      /* Fallback if no task linked yet */
                                      <div
                                        className="grid items-center py-1.5 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        style={{
                                          gridTemplateColumns: `360px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
                                        }}
                                      >
                                        <div className="pl-11 pr-3 flex items-center space-x-2 border-r border-slate-200 dark:border-slate-800 truncate">
                                          <span className="font-mono text-[9px] text-slate-400">{wp.wbsCode}</span>
                                          <span className="truncate">{wp.name}</span>
                                        </div>
                                        <div style={{ gridColumn: `2 / span ${totalTimelineDays}` }} />
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })
            ) : (
              // ==========================================
              // FLAT CPM LIST (ALL 14 TASKS)
              // ==========================================
              cpmTasks.map((task, idx) => (
                <GanttTaskRow
                  key={task.id}
                  task={task}
                  wbsChildCode={task.wbsNode?.wbsCode || `#${idx + 1}`}
                  projectStartDate={projectStartDate}
                  totalTimelineDays={totalTimelineDays}
                  showCriticalPath={showCriticalPath}
                  criticalPathTaskIds={criticalPathTaskIds}
                  zoomMode={zoomMode}
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
  wbsChildCode: string;
  projectStartDate: Date;
  totalTimelineDays: number;
  showCriticalPath: boolean;
  criticalPathTaskIds: Set<string>;
  zoomMode: 'FULL_PROJECT' | 'MONTH';
  indent?: string;
  onTaskClick: (task: Task) => void;
}

function GanttTaskRow({
  task,
  wbsChildCode,
  projectStartDate,
  totalTimelineDays,
  showCriticalPath,
  criticalPathTaskIds,
  zoomMode,
  indent = 'pl-3',
  onTaskClick,
}: GanttTaskRowProps) {
  let taskStart = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
  let taskEnd = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, task.isMilestone ? 0 : 3);

  if (isNaN(taskStart.getTime())) taskStart = projectStartDate;
  if (isNaN(taskEnd.getTime())) taskEnd = addDays(taskStart, task.isMilestone ? 0 : 3);

  const startOffsetDays = differenceInDays(taskStart, projectStartDate);
  const durationDays = task.isMilestone ? 0 : Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalTimelineDays) * 100));
  const widthPercent = task.isMilestone ? 0 : Math.max(1.5, Math.min(100 - leftPercent, (durationDays / totalTimelineDays) * 100));

  const isTaskOnCriticalPath = showCriticalPath && (task.isCritical || criticalPathTaskIds.has(task.id));
  const isMilestone = task.isMilestone || !!task.milestoneId;
  const hasDependencies = (task.dependenciesAsSuccessor?.length ?? 0) > 0 || (task.dependenciesAsPredecessor?.length ?? 0) > 0;

  return (
    <div
      className={`grid items-center transition-colors py-2 ${
        isTaskOnCriticalPath
          ? 'bg-rose-50/30 dark:bg-rose-950/20'
          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
      }`}
      style={{
        gridTemplateColumns: `360px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
      }}
    >
      {/* Left Title & Status Cell */}
      <div
        onClick={() => onTaskClick(task)}
        className={`${indent} pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group`}
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.2 rounded shrink-0 font-bold">
            {wbsChildCode}
          </span>
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
              title={`Total Float / Slack: ${task.totalFloat} days`}
            >
              {task.totalFloat}d
            </span>
          )}
        </div>
      </div>

      {/* Right Timeline Bar */}
      <div
        className="relative h-7 flex items-center"
        style={{ gridColumn: `2 / span ${totalTimelineDays}` }}
      >
        {isMilestone ? (
          /* Milestone Diamond */
          <div
            onClick={() => onTaskClick(task)}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer z-20 hover:scale-150 transition-transform"
            style={{ left: `${leftPercent}%` }}
            title={`Milestone: ${task.title} (${format(taskStart, 'MMM d, yyyy')})`}
          >
            <div className="h-4 w-4 bg-amber-500 rotate-45 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" />
          </div>
        ) : (
          /* Standard / Critical Task Bar */
          <div
            onClick={() => onTaskClick(task)}
            className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-md shadow-sm cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 overflow-hidden z-10 ${
              isTaskOnCriticalPath
                ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-800'
                : 'bg-indigo-500 text-white'
            }`}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: isTaskOnCriticalPath ? '#ef4444' : STATUS_COLORS[task.status] || '#6366f1',
            }}
            title={`${task.title} (${format(taskStart, 'MMM d')} - ${format(taskEnd, 'MMM d')}, ${durationDays} days) | Status: ${task.status} | Slack: ${task.totalFloat ?? 0}d`}
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
