import { format, isPast, isToday } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { Task } from '@/types';

export default function UpcomingDeadlines({ tasks = [] }: { tasks: Task[] }) {
  const tasksWithDueDates = tasks
    .filter((t) => t.dueDate && t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Upcoming Deadlines</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasksWithDueDates.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No approaching deadlines</p>
          ) : (
            tasksWithDueDates.map((task) => {
              const dueDate = new Date(task.dueDate!);
              const overdue = isPast(dueDate) && !isToday(dueDate);
              const dueToday = isToday(dueDate);

              return (
                <div key={task.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        overdue ? 'bg-rose-500' : dueToday ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                    />
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(dueDate, 'MMM d')}
                    </span>
                    {overdue && <Badge variant="destructive">Overdue</Badge>}
                    {dueToday && <Badge variant="warning">Today</Badge>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
