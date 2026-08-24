import { CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsProps {
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    completedThisWeek: number;
  };
}

export default function StatsCards({ stats }: StatsProps) {
  const cards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks || 0,
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
      description: `${stats.totalProjects || 0} active projects`,
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks || 0,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
      description: 'Currently being worked on',
    },
    {
      title: 'Completed',
      value: stats.completedTasks || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
      description: `${stats.completedThisWeek || 0} finished this week`,
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
      description: 'Require immediate attention',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {card.value}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">{card.description}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
