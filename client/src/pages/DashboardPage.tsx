import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import StatsCards from '@/components/dashboard/StatsCards';
import TasksByStatusChart from '@/components/dashboard/TasksByStatusChart';
import TasksByPriorityChart from '@/components/dashboard/TasksByPriorityChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import useAuthStore from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity'),
      ]);
      return {
        stats: statsRes.data || {},
        activity: Array.isArray(activityRes.data) ? activityRes.data : [],
        upcomingTasks: Array.isArray(statsRes.data?.upcomingTasks) ? statsRes.data.upcomingTasks : [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    completedThisWeek: 0,
  };

  const statusChartData = [
    { name: 'To Do', value: stats.todoTasks || 0 },
    { name: 'In Progress', value: stats.inProgressTasks || 0 },
    { name: 'In Review', value: stats.inReviewTasks || 0 },
    { name: 'Done', value: stats.completedTasks || 0 },
  ];

  const priorityChartData = [
    { priority: 'CRITICAL', count: stats.criticalTasks || 0 },
    { priority: 'HIGH', count: stats.highTasks || 0 },
    { priority: 'MEDIUM', count: stats.mediumTasks || 0 },
    { priority: 'LOW', count: stats.lowTasks || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {user?.name || 'there'} 👋
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here is what's happening across your projects today.
        </p>
      </div>

      {/* 4 Stats Cards */}
      <StatsCards stats={stats} />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TasksByStatusChart data={statusChartData} />
        <TasksByPriorityChart data={priorityChartData} />
      </div>

      {/* Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingDeadlines tasks={dashboardData?.upcomingTasks || []} />
        <RecentActivity activities={dashboardData?.activity || []} />
      </div>
    </div>
  );
}
