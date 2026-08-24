import { useState, useMemo } from 'react';
import { Task, DependencyType } from '@/types';
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
import { ChevronLeft, ChevronRight, BarChart2, Zap, Diamond, Flag, Link2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { calculateCriticalPath } from '@/lib/cpm';

interface GanttViewProps {
  tasks: Task[];
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

export default function GanttView({ tasks = [], onTaskClick }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCriticalPath, setShowCriticalPath] = useState(true);

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

  // Quick lookup of task row index for drawing dependency lines
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    cpmTasks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [cpmTasks]);

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
                Gantt Timeline & Critical Path
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

        <div className="flex items-center flex-wrap gap-3">
          {/* Critical Path Toggle */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg">
            <Switch
              id="critical-path-toggle"
              checked={showCriticalPath}
              onCheckedChange={setShowCriticalPath}
            />
            <label
              htmlFor="critical-path-toggle"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center"
            >
              <Zap className="h-3.5 w-3.5 mr-1 text-rose-500" />
              Critical Path (CPM)
            </label>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 text-slate-500">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 text-slate-500">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto relative">
        <div className="min-w-[1000px] relative">
          {/* Header Row: Task Name + Days */}
          <div
            className="grid border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 sticky top-0 z-20"
            style={{
              gridTemplateColumns: `280px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Task & Milestone Items ({cpmTasks.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Slack (Days)</span>
            </div>
            {days.map((day) => {
              const isDayToday = isToday(day);
              const isDayWeekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-1.5 text-center text-[10px] border-r border-slate-100 dark:border-slate-800/80 flex flex-col justify-center items-center ${
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

          {/* Task Rows Container */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 relative z-10">
            {cpmTasks.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-400">
                No tasks available. Add tasks on the Kanban board to inspect critical path and dependencies.
              </div>
            ) : (
              cpmTasks.map((task, rowIndex) => {
                let taskStart = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
                let taskEnd = task.dueDate ? new Date(task.dueDate) : addDays(taskStart, task.isMilestone ? 0 : 3);

                if (isNaN(taskStart.getTime())) taskStart = monthStart;
                if (isNaN(taskEnd.getTime())) taskEnd = addDays(taskStart, task.isMilestone ? 0 : 3);

                const startOffsetDays = differenceInDays(taskStart, monthStart);
                const durationDays = task.isMilestone ? 0 : Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

                const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalDaysInMonth) * 100));
                const widthPercent = task.isMilestone ? 0 : Math.max(3, Math.min(100 - leftPercent, (durationDays / totalDaysInMonth) * 100));

                const isVisibleInMonth =
                  (taskStart >= monthStart && taskStart <= monthEnd) ||
                  (taskEnd >= monthStart && taskEnd <= monthEnd) ||
                  (taskStart <= monthStart && taskEnd >= monthEnd);

                const isTaskOnCriticalPath = showCriticalPath && (task.isCritical || criticalPathTaskIds.has(task.id));
                const isMilestone = task.isMilestone || !!task.milestoneId;
                const hasDependencies = (task.dependenciesAsSuccessor?.length ?? 0) > 0 || (task.dependenciesAsPredecessor?.length ?? 0) > 0;

                return (
                  <div
                    key={task.id}
                    className={`grid items-center transition-colors py-2.5 ${
                      isTaskOnCriticalPath
                        ? 'bg-rose-50/30 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                    style={{
                      gridTemplateColumns: `280px repeat(${totalDaysInMonth}, minmax(30px, 1fr))`,
                    }}
                  >
                    {/* Left Title & Status Cell */}
                    <div
                      onClick={() => onTaskClick(task)}
                      className="px-3 text-xs font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer group"
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
                          <span title="Has CPM Dependencies">
                            <Link2 className="h-3 w-3 text-indigo-500" />
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.slack !== undefined ? `${task.slack}d` : '0d'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Bar Area */}
                    <div
                      className="relative h-8 flex items-center px-1"
                      style={{ gridColumn: `2 / span ${totalDaysInMonth}` }}
                    >
                      {isVisibleInMonth ? (
                        isMilestone ? (
                          /* Milestone Diamond Marker */
                          <div
                            onClick={() => onTaskClick(task)}
                            className="absolute flex items-center space-x-2 cursor-pointer z-10 group"
                            style={{ left: `${leftPercent}%`, transform: 'translateX(-50%)' }}
                            title={`Milestone: ${task.title} (Target: ${format(taskStart, 'MMM d, yyyy')})`}
                          >
                            <div className="h-6 w-6 rotate-45 rounded bg-gradient-to-tr from-amber-500 to-amber-400 shadow-md border-2 border-white dark:border-slate-900 flex items-center justify-center transition-transform group-hover:scale-125">
                              <Flag className="h-3 w-3 -rotate-45 text-white" />
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {task.title}
                            </span>
                          </div>
                        ) : (
                          /* Standard Task Timeline Bar */
                          <div
                            onClick={() => onTaskClick(task)}
                            className={`absolute h-6 rounded-md text-[11px] text-white flex items-center px-2.5 font-medium shadow-sm cursor-pointer transition-all truncate border ${
                              isTaskOnCriticalPath
                                ? 'bg-gradient-to-r from-rose-500 to-red-600 border-rose-400 shadow-rose-500/20 shadow-md ring-2 ring-rose-400/40'
                                : 'border-black/10 hover:brightness-110 hover:shadow-md'
                            }`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${Math.max(4, widthPercent)}%`,
                              backgroundColor: !isTaskOnCriticalPath ? STATUS_COLORS[task.status] || '#4f46e5' : undefined,
                            }}
                            title={`${task.title}\nStatus: ${task.status}\nDates: ${format(taskStart, 'MMM d')} - ${format(taskEnd, 'MMM d')}\nSlack: ${task.slack ?? 0} days\n${isTaskOnCriticalPath ? '⚡ CRITICAL PATH' : ''}`}
                          >
                            {isTaskOnCriticalPath && <Zap className="h-3 w-3 mr-1 shrink-0 animate-pulse text-amber-200" />}
                            <span className="truncate font-semibold">{task.title}</span>
                          </div>
                        )
                      ) : (
                        <div
                          onClick={() => onTaskClick(task)}
                          className="text-[10px] text-slate-400 italic cursor-pointer pl-3 hover:text-indigo-600"
                        >
                          {format(taskStart, 'MMM d')} → {format(taskEnd, 'MMM d')} (Outside month window)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>

      {/* Legend Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 px-6 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded bg-rose-500 ring-2 ring-rose-400/50" />
            <span className="font-medium text-rose-600 dark:text-rose-400">Critical Path Task (Slack = 0)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Diamond className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium text-amber-600 dark:text-amber-400">Key Milestone (◆)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500" />
            <span>Done</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Supported CPM Relationships:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">FS (Finish-to-Start)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">SS (Start-to-Start)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">FF (Finish-to-Finish)</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">SF (Start-to-Finish)</span>
        </div>
      </div>
    </Card>
  );
}
