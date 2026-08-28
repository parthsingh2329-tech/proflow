import React, { useState, useMemo } from 'react';
import { Task, DependencyType, WBSNode, WBSNodeType } from '@/types';
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
  Clock,
  HelpCircle
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
  const [showSlack, setShowSlack] = useState(true);
  const [viewMode, setViewMode] = useState<'WBS' | 'FLAT'>('WBS');
  const [zoomMode, setZoomMode] = useState<'FULL_PROJECT' | 'MONTH'>('FULL_PROJECT');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Fetch the EXACT live WBS tree that is displayed in the WBS tab
  const { data: wbsTree = [], isLoading: isWbsLoading } = useWBS(projectId);

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

  // Helper to find associated CPM Task for a WBS Node
  const findTaskForWBSNode = (node: WBSNode): (Task & { isCritical?: boolean; slack?: number; totalFloat?: number }) | undefined => {
    return cpmTasks.find((t) => {
      if (t.wbsNodeId === node.id || t.wbsNode?.id === node.id) return true;
      if (t.wbsNode?.wbsCode === node.wbsCode) return true;
      if (t.title.toLowerCase().trim() === node.name.toLowerCase().trim()) return true;

      // Match by code prefix or keyword
      const nodeCode = node.wbsCode;
      const titleLower = t.title.toLowerCase();
      if (nodeCode === '1.1.1' && (titleLower.includes('inverter') || titleLower.includes('power stage'))) return true;
      if (nodeCode === '1.1.2' && titleLower.includes('gate driver')) return true;
      if (nodeCode === '1.1.3' && titleLower.includes('500kw')) return true;
      if (nodeCode === '1.2.1' && (titleLower.includes('immersion') || titleLower.includes('fluid') || titleLower.includes('cfd'))) return true;
      if (nodeCode === '1.2.2' && (titleLower.includes('bms') || titleLower.includes('balancing'))) return true;
      if (nodeCode === '1.2.3' && (titleLower.includes('nail') || titleLower.includes('penetration'))) return true;
      if (nodeCode === '1.2.4' && (titleLower.includes('crush') || titleLower.includes('enclosure') || titleLower.includes('fea'))) return true;
      if (nodeCode === '2.1.1' && (titleLower.includes('active aero') || titleLower.includes('venturi'))) return true;
      if (nodeCode === '2.1.2' && (titleLower.includes('torque') || titleLower.includes('esc'))) return true;
      if (nodeCode === '2.2.1' && (titleLower.includes('camera') || titleLower.includes('calibration'))) return true;
      if (nodeCode === '2.2.2' && (titleLower.includes('point cloud') || titleLower.includes('fusion') || titleLower.includes('solid-state'))) return true;
      if (nodeCode === '3.1.1' && (titleLower.includes('giga') || titleLower.includes('press') || titleLower.includes('die tooling'))) return true;
      if (nodeCode === '3.1.2' && (titleLower.includes('takt') || titleLower.includes('assembly'))) return true;
      if (nodeCode === '4.1.1' && titleLower.includes('26262')) return true;
      if (nodeCode === '4.1.2' && (titleLower.includes('gate 1') || titleLower.includes('design freeze'))) return true;
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
                Gantt Timeline & CPM Schedule with Slack Analysis
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {wbsTree.length > 0 ? `${wbsTree.length} WBS Phases` : `${cpmTasks.length} Activities`}
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
              <span>Full Horizon</span>
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
              <span>WBS Tree</span>
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
              <span>Flat CPM</span>
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

          {/* Slack / Float Toggle */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-lg">
            <Switch
              id="slack-toggle"
              checked={showSlack}
              onCheckedChange={setShowSlack}
            />
            <label
              htmlFor="slack-toggle"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center space-x-1"
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Total Slack</span>
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
            <span className="text-slate-600 dark:text-slate-400">WBS Phase Summary</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-6 rounded bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-400">Standard Activity</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-6 rounded bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-rose-600 dark:text-rose-400">Critical Path (0d Slack)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-7 border-y border-r border-dashed border-amber-400 bg-amber-100/60 dark:bg-amber-950/60 rounded-r" />
            <span className="text-slate-600 dark:text-slate-400 font-medium text-amber-700 dark:text-amber-400">Total Slack / Float Bar</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Diamond className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">APQP Milestone Gate</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium hidden sm:flex">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>Slack = Maximum delay without pushing project deadline</span>
        </div>
      </div>

      {/* Scrollable Gantt Matrix */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[1100px] select-none">
          {/* Header Row: Days & Months */}
          <div
            className="grid bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold sticky top-0 z-20"
            style={{
              gridTemplateColumns: `420px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>{viewMode === 'WBS' ? 'WBS Tree Hierarchy & Work Packages' : 'All Project Activities'}</span>
              <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-normal">
                <span>Slack</span>
                <span>Progress</span>
              </div>
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
              // EXACT RECURSIVE WBS TREE FROM BACKEND
              // ==========================================
              wbsTree.map((phaseNode) => (
                <RecursiveWBSGanttRow
                  key={phaseNode.id}
                  node={phaseNode}
                  level={0}
                  collapsedNodes={collapsedNodes}
                  toggleNodeCollapse={toggleNodeCollapse}
                  findTaskForWBSNode={findTaskForWBSNode}
                  projectStartDate={projectStartDate}
                  totalTimelineDays={totalTimelineDays}
                  showCriticalPath={showCriticalPath}
                  showSlack={showSlack}
                  criticalPathTaskIds={criticalPathTaskIds}
                  zoomMode={zoomMode}
                  onTaskClick={onTaskClick}
                />
              ))
            ) : (
              // ==========================================
              // FLAT CPM LIST (ALL TASKS)
              // ==========================================
              cpmTasks.map((task, idx) => (
                <FlatGanttTaskRow
                  key={task.id}
                  task={task}
                  wbsChildCode={task.wbsNode?.wbsCode || `#${idx + 1}`}
                  projectStartDate={projectStartDate}
                  totalTimelineDays={totalTimelineDays}
                  showCriticalPath={showCriticalPath}
                  showSlack={showSlack}
                  criticalPathTaskIds={criticalPathTaskIds}
                  zoomMode={zoomMode}
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
// RECURSIVE WBS GANTT ROW COMPONENT WITH SLACK
// ----------------------------------------------------
interface RecursiveWBSGanttRowProps {
  node: WBSNode;
  level: number;
  collapsedNodes: Set<string>;
  toggleNodeCollapse: (id: string) => void;
  findTaskForWBSNode: (node: WBSNode) => (Task & { isCritical?: boolean; slack?: number; totalFloat?: number }) | undefined;
  projectStartDate: Date;
  totalTimelineDays: number;
  showCriticalPath: boolean;
  showSlack: boolean;
  criticalPathTaskIds: Set<string>;
  zoomMode: 'FULL_PROJECT' | 'MONTH';
  onTaskClick: (task: Task) => void;
}

function RecursiveWBSGanttRow({
  node,
  level,
  collapsedNodes,
  toggleNodeCollapse,
  findTaskForWBSNode,
  projectStartDate,
  totalTimelineDays,
  showCriticalPath,
  showSlack,
  criticalPathTaskIds,
  zoomMode,
  onTaskClick,
}: RecursiveWBSGanttRowProps) {
  const isCollapsed = collapsedNodes.has(node.id);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isPhase = node.nodeType === 'PHASE';
  const isDeliverable = node.nodeType === 'DELIVERABLE';

  const linkedTask = findTaskForWBSNode(node);
  const taskSlack = linkedTask?.slack ?? linkedTask?.totalFloat ?? 0;

  // Determine dates
  let nodeStart = node.startDate ? new Date(node.startDate) : linkedTask?.startDate ? new Date(linkedTask.startDate) : projectStartDate;
  let nodeEnd = node.dueDate ? new Date(node.dueDate) : linkedTask?.dueDate ? new Date(linkedTask.dueDate) : addDays(nodeStart, 14);

  if (isNaN(nodeStart.getTime())) nodeStart = projectStartDate;
  if (isNaN(nodeEnd.getTime())) nodeEnd = addDays(nodeStart, 14);

  const startOffsetDays = differenceInDays(nodeStart, projectStartDate);
  const durationDays = linkedTask?.isMilestone ? 0 : Math.max(1, differenceInDays(nodeEnd, nodeStart) + 1);

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalTimelineDays) * 100));
  const widthPercent = linkedTask?.isMilestone ? 0 : Math.max(1.5, Math.min(100 - leftPercent, (durationDays / totalTimelineDays) * 100));

  // Slack Bar positioning
  const slackStartOffsetDays = startOffsetDays + durationDays;
  const slackLeftPercent = Math.max(0, Math.min(100, (slackStartOffsetDays / totalTimelineDays) * 100));
  const slackWidthPercent = Math.max(0, Math.min(100 - slackLeftPercent, (taskSlack / totalTimelineDays) * 100));

  const isTaskOnCriticalPath = showCriticalPath && (linkedTask?.isCritical || (linkedTask && criticalPathTaskIds.has(linkedTask.id)) || taskSlack === 0);
  const isMilestone = linkedTask?.isMilestone || node.name.includes('◆') || node.name.toLowerCase().includes('sign-off');

  // Indentation styling based on WBS depth
  const indentClass = level === 0 ? 'pl-3' : level === 1 ? 'pl-7' : 'pl-11';

  return (
    <>
      <div
        className={`grid items-center transition-colors py-2 border-b border-slate-100 dark:border-slate-800 ${
          isPhase
            ? 'bg-slate-100/90 dark:bg-slate-800/80 font-bold'
            : isDeliverable
            ? 'bg-slate-50/70 dark:bg-slate-900/50 font-semibold'
            : isTaskOnCriticalPath
            ? 'bg-rose-50/30 dark:bg-rose-950/20'
            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
        }`}
        style={{
          gridTemplateColumns: `420px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
        }}
      >
        {/* Left Side: WBS Node Hierarchy Details + Slack badge */}
        <div
          onClick={() => {
            if (hasChildren) toggleNodeCollapse(node.id);
            else if (linkedTask) onTaskClick(linkedTask);
          }}
          className={`${indentClass} pr-3 text-xs border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group truncate`}
        >
          <div className="flex items-center space-x-2 truncate pr-2">
            {hasChildren ? (
              <span className="p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 shrink-0">
                {isCollapsed ? (
                  <ChevronRightIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                )}
              </span>
            ) : isMilestone ? (
              <Diamond className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
            ) : isTaskOnCriticalPath ? (
              <Zap className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            ) : (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[linkedTask?.status || 'IN_PROGRESS'] || '#6366f1' }}
              />
            )}

            {/* WBS Code Badge */}
            <span
              className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                isPhase
                  ? 'bg-indigo-600 text-white'
                  : isDeliverable
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {node.wbsCode}
            </span>

            <span className={`truncate ${isPhase ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
              {node.name}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Slack Badge */}
            {!isPhase && !isDeliverable && !isMilestone && linkedTask && (
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isTaskOnCriticalPath || taskSlack === 0
                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900'
                }`}
                title={`Total Float / Slack: ${taskSlack} days`}
              >
                {taskSlack === 0 ? '0d Slack' : `+${taskSlack}d Slack`}
              </span>
            )}

            {linkedTask && (linkedTask.dependenciesAsSuccessor?.length ?? 0) + (linkedTask.dependenciesAsPredecessor?.length ?? 0) > 0 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono text-slate-400">
                <Link2 className="h-2.5 w-2.5 mr-0.5" />
                {(linkedTask.dependenciesAsSuccessor?.length ?? 0) + (linkedTask.dependenciesAsPredecessor?.length ?? 0)}
              </Badge>
            )}
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {node.progress}%
            </span>
          </div>
        </div>

        {/* Right Side: Timeline Bar & Slack Rendering */}
        <div
          className="relative h-7 flex items-center"
          style={{ gridColumn: `2 / span ${totalTimelineDays}` }}
        >
          {isPhase ? (
            /* WBS Phase Summary Bracket Bar */
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 bg-slate-800 dark:bg-slate-200 rounded-sm shadow-sm flex items-center overflow-hidden z-10"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              title={`Phase ${node.wbsCode} ${node.name} (${format(nodeStart, 'MMM d')} - ${format(nodeEnd, 'MMM d')}, ${node.progress}% complete)`}
            >
              <div className="h-full bg-indigo-600" style={{ width: `${node.progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100 z-10 left-0" />
              <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-slate-900 dark:bg-slate-100 z-10 right-0" />
            </div>
          ) : isMilestone ? (
            /* Milestone Diamond */
            <div
              onClick={() => linkedTask && onTaskClick(linkedTask)}
              className="absolute top-1/2 -translate-y-1/2 cursor-pointer z-20 hover:scale-150 transition-transform"
              style={{ left: `${leftPercent}%` }}
              title={`Milestone: ${node.wbsCode} ${node.name} (${format(nodeStart, 'MMM d, yyyy')})`}
            >
              <div className="h-4 w-4 bg-amber-500 rotate-45 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" />
            </div>
          ) : (
            <>
              {/* Standard / Critical Task Bar */}
              <div
                onClick={() => linkedTask && onTaskClick(linkedTask)}
                className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-md shadow-sm cursor-pointer transition-all hover:brightness-110 flex items-center px-1.5 overflow-hidden z-10 ${
                  isTaskOnCriticalPath
                    ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-800'
                    : 'bg-indigo-500 text-white'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: isTaskOnCriticalPath ? '#ef4444' : STATUS_COLORS[linkedTask?.status || 'IN_PROGRESS'] || '#6366f1',
                }}
                title={`${node.wbsCode} ${node.name} (${format(nodeStart, 'MMM d')} - ${format(nodeEnd, 'MMM d')}, ${durationDays} days)\nStatus: ${linkedTask?.status || 'IN_PROGRESS'} | Slack: ${taskSlack} days`}
              >
                <span className="text-[9px] font-semibold truncate leading-none drop-shadow">
                  {node.name}
                </span>
              </div>

              {/* Slack / Float Extension Bar */}
              {showSlack && taskSlack > 0 && slackWidthPercent > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3.5 border-y border-r border-dashed border-amber-500/80 bg-amber-100/50 dark:bg-amber-950/40 rounded-r-md z-5 flex items-center justify-end pr-1 cursor-pointer transition-all hover:bg-amber-200/60"
                  style={{
                    left: `${slackLeftPercent}%`,
                    width: `${slackWidthPercent}%`,
                  }}
                  title={`Available Total Float / Slack: +${taskSlack} days\nActivity can slip by ${taskSlack} days without delaying project completion.\nLate Finish: ${format(addDays(nodeEnd, taskSlack), 'MMM d, yyyy')}`}
                >
                  <span className="text-[8px] font-mono font-bold text-amber-800 dark:text-amber-300 select-none">
                    +{taskSlack}d
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recursive Children Render If Not Collapsed */}
      {!isCollapsed &&
        node.children &&
        node.children.map((child) => (
          <RecursiveWBSGanttRow
            key={child.id}
            node={child}
            level={level + 1}
            collapsedNodes={collapsedNodes}
            toggleNodeCollapse={toggleNodeCollapse}
            findTaskForWBSNode={findTaskForWBSNode}
            projectStartDate={projectStartDate}
            totalTimelineDays={totalTimelineDays}
            showCriticalPath={showCriticalPath}
            showSlack={showSlack}
            criticalPathTaskIds={criticalPathTaskIds}
            zoomMode={zoomMode}
            onTaskClick={onTaskClick}
          />
        ))}
    </>
  );
}

// ----------------------------------------------------
// FLAT CPM TASK ROW WITH SLACK
// ----------------------------------------------------
interface FlatGanttTaskRowProps {
  task: Task & { isCritical?: boolean; slack?: number; totalFloat?: number };
  wbsChildCode: string;
  projectStartDate: Date;
  totalTimelineDays: number;
  showCriticalPath: boolean;
  showSlack: boolean;
  criticalPathTaskIds: Set<string>;
  zoomMode: 'FULL_PROJECT' | 'MONTH';
  onTaskClick: (task: Task) => void;
}

function FlatGanttTaskRow({
  task,
  wbsChildCode,
  projectStartDate,
  totalTimelineDays,
  showCriticalPath,
  showSlack,
  criticalPathTaskIds,
  zoomMode,
  onTaskClick,
}: FlatGanttTaskRowProps) {
  let taskStart = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
  let taskEnd = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, task.isMilestone ? 0 : 3);

  if (isNaN(taskStart.getTime())) taskStart = projectStartDate;
  if (isNaN(taskEnd.getTime())) taskEnd = addDays(taskStart, task.isMilestone ? 0 : 3);

  const startOffsetDays = differenceInDays(taskStart, projectStartDate);
  const durationDays = task.isMilestone ? 0 : Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
  const taskSlack = task.slack ?? task.totalFloat ?? 0;

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalTimelineDays) * 100));
  const widthPercent = task.isMilestone ? 0 : Math.max(1.5, Math.min(100 - leftPercent, (durationDays / totalTimelineDays) * 100));

  const slackStartOffsetDays = startOffsetDays + durationDays;
  const slackLeftPercent = Math.max(0, Math.min(100, (slackStartOffsetDays / totalTimelineDays) * 100));
  const slackWidthPercent = Math.max(0, Math.min(100 - slackLeftPercent, (taskSlack / totalTimelineDays) * 100));

  const isTaskOnCriticalPath = showCriticalPath && (task.isCritical || criticalPathTaskIds.has(task.id) || taskSlack === 0);
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
        gridTemplateColumns: `420px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
      }}
    >
      <div
        onClick={() => onTaskClick(task)}
        className="pl-3 pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.2 rounded font-bold shrink-0">
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

        <div className="flex items-center space-x-2 shrink-0">
          {/* Slack Badge */}
          {!isMilestone && (
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isTaskOnCriticalPath || taskSlack === 0
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900'
              }`}
              title={`Total Float / Slack: ${taskSlack} days`}
            >
              {taskSlack === 0 ? '0d Slack' : `+${taskSlack}d Slack`}
            </span>
          )}

          {hasDependencies && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono text-slate-400">
              <Link2 className="h-2.5 w-2.5 mr-0.5" />
              {(task.dependenciesAsSuccessor?.length ?? 0) + (task.dependenciesAsPredecessor?.length ?? 0)}
            </Badge>
          )}
        </div>
      </div>

      <div
        className="relative h-7 flex items-center"
        style={{ gridColumn: `2 / span ${totalTimelineDays}` }}
      >
        {isMilestone ? (
          <div
            onClick={() => onTaskClick(task)}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer z-20 hover:scale-150 transition-transform"
            style={{ left: `${leftPercent}%` }}
            title={`Milestone: ${task.title}`}
          >
            <div className="h-4 w-4 bg-amber-500 rotate-45 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center" />
          </div>
        ) : (
          <>
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
              title={`${task.title} (${durationDays} days)\nStatus: ${task.status} | Slack: ${taskSlack} days`}
            >
              <span className="text-[9px] font-semibold truncate leading-none drop-shadow">
                {task.title}
              </span>
            </div>

            {/* Slack / Float Extension Bar */}
            {showSlack && taskSlack > 0 && slackWidthPercent > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3.5 border-y border-r border-dashed border-amber-500/80 bg-amber-100/50 dark:bg-amber-950/40 rounded-r-md z-5 flex items-center justify-end pr-1 cursor-pointer transition-all hover:bg-amber-200/60"
                style={{
                  left: `${slackLeftPercent}%`,
                  width: `${slackWidthPercent}%`,
                }}
                title={`Available Total Float / Slack: +${taskSlack} days\nActivity can slip by ${taskSlack} days without delaying project completion.\nLate Finish: ${format(addDays(taskEnd, taskSlack), 'MMM d, yyyy')}`}
              >
                <span className="text-[8px] font-mono font-bold text-amber-800 dark:text-amber-300 select-none">
                  +{taskSlack}d
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
