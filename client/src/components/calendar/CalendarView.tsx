import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-rose-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  LOW: 'bg-blue-500 text-white',
  NONE: 'bg-slate-500 text-white',
};

export default function CalendarView({ tasks = [], onTaskClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  return (
    <Card className="shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      {/* Calendar Header */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={today} className="text-xs h-8">
            Today
          </Button>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-slate-500">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-slate-500">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-800">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => {
              if (!t.dueDate && !t.startDate) return false;
              const targetDate = new Date(t.dueDate || t.startDate!);
              return isSameDay(targetDate, day);
            });

            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] p-2 transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/40 dark:bg-slate-950/20 text-slate-400' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isDayToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day Tasks */}
                <div className="mt-2 space-y-1 overflow-y-auto max-h-20">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onTaskClick?.(task)}
                      className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80 block ${
                        PRIORITY_COLORS[task.priority] || 'bg-indigo-600 text-white'
                      }`}
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-[10px] text-slate-400 font-medium pl-1">
                      +{dayTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
