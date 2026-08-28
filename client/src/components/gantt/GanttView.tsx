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
  isWeekend,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek
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
  Calendar as CalendarIcon,
  Maximize2,
  Minimize2,
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

// Standard fallback WBS structure if backend WBS is empty
const DEFAULT_WBS_CATEGORIES = [
  {
    code: '1.0',
    name: 'Powertrain & High-Voltage Architecture',
    keywords: ['inverter', 'battery', 'bms', 'immersion', 'dyno', 'voltage', 'power', 'cell'],
  },
  {
    code: '2.0',
    name: 'Autonomous Driving (ADAS) & Sensor Integration',
    keywords: ['lidar', 'camera', 'adas', 'radar', 'sensor', 'perception', 'autonomy'],
  },
  {
    code: '3.0',
    name: 'Chassis Dynamics & Aerodynamics',
    keywords: ['aero', 'chassis', 'suspension', 'torque', 'vectoring', 'esc', 'wind'],
  },
  {
    code: '4.0',
    name: 'Body-in-White, Tooling & Production',
    keywords: ['giga', 'press', 'tooling', 'assembly', 'takt', 'manufacturing', 'mfg'],
  },
  {
    code: '5.0',
    name: 'Functional Safety, Homologation & APQP Gates',
    keywords: ['safety', 'iso', '26262', 'homologation', 'gate', 'ncap', 'unece', 'sign-off', 'freeze', 'type approval'],
  },
];

export default function GanttView({ tasks = [], projectId, onTaskClick }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-03-01'));
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [viewMode, setViewMode] = useState<'WBS' | 'FLAT'>('WBS');
  const [zoomMode, setZoomMode] = useState<'FULL_PROJECT' | 'MONTH'>('FULL_PROJECT');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Fetch WBS hierarchy if projectId is available
  const { data: rawWbsNodes = [] } = useWBS(projectId);

  // Compute Critical Path Metrics across all project tasks
  const { tasks: cpmTasks, criticalPathTaskIds, projectDurationDays } = useMemo(() => {
    return calculateCriticalPath(tasks);
  }, [tasks]);

  // Determine full project time horizon (Earliest start to Latest end across all tasks)
  const { projectStartDate, projectEndDate, timelineDays, timelineWeeks } = useMemo(() => {
    let minDate = new Date('2026-01-15');
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
    const weeks = eachWeekOfInterval({ start: minDate, end: maxDate });

    return { projectStartDate: minDate, projectEndDate: maxDate, timelineDays: days, timelineWeeks: weeks };
  }, [cpmTasks, zoomMode, currentMonth]);

  const totalTimelineDays = timelineDays.length;

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date('2026-03-01'));

  const toggleNodeCollapse = (nodeCode: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeCode)) {
        next.delete(nodeCode);
      } else {
        next.add(nodeCode);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedNodes(new Set());
  const collapseAll = () => {
    const allCodes = new Set(DEFAULT_WBS_CATEGORIES.map((c) => c.code));
    setCollapsedNodes(allCodes);
  };

  // Group ALL tasks under WBS categories without losing any single task
  const wbsGroups = useMemo(() => {
    const groups: {
      code: string;
      name: string;
      tasks: (Task & { isCritical?: boolean; totalFloat?: number })[];
      startDate: Date;
      endDate: Date;
      progress: number;
    }[] = [];

    const assignedTaskIds = new Set<string>();

    DEFAULT_WBS_CATEGORIES.forEach((cat) => {
      const matchedTasks = cpmTasks.filter((task) => {
        const titleLower = task.title.toLowerCase();
        const descLower = (task.description || '').toLowerCase();
        return cat.keywords.some((kw) => titleLower.includes(kw) || descLower.includes(kw));
      });

      matchedTasks.forEach((t) => assignedTaskIds.add(t.id));

      if (matchedTasks.length > 0) {
        // Calculate date envelope
        const startTimes = matchedTasks
          .map((t) => (t.startDate ? new Date(t.startDate).getTime() : t.dueDate ? new Date(t.dueDate).getTime() : null))
          .filter((t): t is number => t !== null && !isNaN(t));
        const endTimes = matchedTasks
          .map((t) => (t.dueDate ? new Date(t.dueDate).getTime() : null))
          .filter((t): t is number => t !== null && !isNaN(t));

        const catStart = startTimes.length > 0 ? new Date(Math.min(...startTimes)) : projectStartDate;
        const catEnd = endTimes.length > 0 ? new Date(Math.max(...endTimes)) : projectEndDate;

        const doneCount = matchedTasks.filter((t) => t.status === 'DONE').length;
        const inProgCount = matchedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const progress = Math.round(((doneCount * 1.0 + inProgCount * 0.5) / matchedTasks.length) * 100);

        groups.push({
          code: cat.code,
          name: cat.name,
          tasks: matchedTasks,
          startDate: catStart,
          endDate: catEnd,
          progress,
        });
      }
    });

    // Collect any remaining unassigned tasks
    const unassigned = cpmTasks.filter((t) => !assignedTaskIds.has(t.id));
    if (unassigned.length > 0) {
      const startTimes = unassigned
        .map((t) => (t.startDate ? new Date(t.startDate).getTime() : null))
        .filter((t): t is number => t !== null && !isNaN(t));
      const endTimes = unassigned
        .map((t) => (t.dueDate ? new Date(t.dueDate).getTime() : null))
        .filter((t): t is number => t !== null && !isNaN(t));

      const unassignedStart = startTimes.length > 0 ? new Date(Math.min(...startTimes)) : projectStartDate;
      const unassignedEnd = endTimes.length > 0 ? new Date(Math.max(...endTimes)) : projectEndDate;

      groups.push({
        code: '6.0',
        name: 'Additional Work Packages & Milestones',
        tasks: unassigned,
        startDate: unassignedStart,
        endDate: unassignedEnd,
        progress: 50,
      });
    }

    return groups;
  }, [cpmTasks, projectStartDate, projectEndDate]);

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
          {/* Zoom Mode: Full Project Timeline vs Monthly */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setZoomMode('FULL_PROJECT')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                zoomMode === 'FULL_PROJECT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show entire project life cycle from start to finish"
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
              title="Zoom in on a single month"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Single Month Zoom</span>
            </button>
          </div>

          {/* View Mode Switcher: WBS Hierarchy vs Flat CPM List */}
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

          {/* Month Navigation (Only in Month Zoom Mode) */}
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
          Click any row to view task details, CPM float & dependencies
        </span>
      </div>

      {/* Scrollable Gantt Matrix */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[1100px] select-none">
          {/* Header Row: Days & Months */}
          <div
            className="grid bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold sticky top-0 z-20"
            style={{
              gridTemplateColumns: `340px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>{viewMode === 'WBS' ? 'WBS Structure & Deliverables' : 'All Project Activities'} ({cpmTasks.length})</span>
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
            {viewMode === 'WBS' ? (
              // ==========================================
              // WBS HIERARCHY VIEW (100% OF TASKS GROUPED)
              // ==========================================
              wbsGroups.map((group) => {
                const isCollapsed = collapsedNodes.has(group.code);

                const phaseStartOffset = differenceInDays(group.startDate, projectStartDate);
                const phaseDuration = Math.max(1, differenceInDays(group.endDate, group.startDate) + 1);
                const phaseLeftPercent = Math.max(0, Math.min(100, (phaseStartOffset / totalTimelineDays) * 100));
                const phaseWidthPercent = Math.max(2, Math.min(100 - phaseLeftPercent, (phaseDuration / totalTimelineDays) * 100));

                return (
                  <React.Fragment key={group.code}>
                    {/* WBS Phase Header & Summary Bracket */}
                    <div
                      className="grid items-center bg-slate-100/80 dark:bg-slate-800/70 font-semibold py-2.5 border-b border-slate-200 dark:border-slate-700 transition-colors"
                      style={{
                        gridTemplateColumns: `340px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
                      }}
                    >
                      {/* Left Phase Title */}
                      <div
                        onClick={() => toggleNodeCollapse(group.code)}
                        className="px-3 text-xs font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span className="p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0" />
                            )}
                          </span>
                          <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                            {group.code}
                          </span>
                          <span className="truncate">{group.name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-mono font-normal">
                            {group.tasks.length} items
                          </Badge>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {group.progress}%
                          </span>
                        </div>
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
                          title={`WBS Phase ${group.code} ${group.name} (${format(group.startDate, 'MMM d')} - ${format(group.endDate, 'MMM d')}, ${group.progress}% complete)`}
                        >
                          <div
                            className="h-full bg-indigo-600"
                            style={{ width: `${group.progress}%` }}
                          />
                        </div>
                        {/* Summary Bracket Endpoints */}
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

                    {/* Child Task Rows */}
                    {!isCollapsed &&
                      group.tasks.map((task, idx) => (
                        <GanttTaskRow
                          key={task.id}
                          task={task}
                          wbsChildCode={`${group.code}.${idx + 1}`}
                          projectStartDate={projectStartDate}
                          totalTimelineDays={totalTimelineDays}
                          showCriticalPath={showCriticalPath}
                          criticalPathTaskIds={criticalPathTaskIds}
                          zoomMode={zoomMode}
                          indent="pl-8"
                          onTaskClick={onTaskClick}
                        />
                      ))}
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
                  wbsChildCode={`#${idx + 1}`}
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
        gridTemplateColumns: `340px repeat(${totalTimelineDays}, minmax(${zoomMode === 'FULL_PROJECT' ? '12px' : '28px'}, 1fr))`,
      }}
    >
      {/* Left Title & Status Cell */}
      <div
        onClick={() => onTaskClick(task)}
        className={`${indent} pr-3 text-xs font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group`}
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          <span className="font-mono text-[9px] text-slate-400 shrink-0">{wbsChildCode}</span>
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
