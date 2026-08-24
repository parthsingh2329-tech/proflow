import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity } from 'lucide-react';

export default function RecentActivity({ activities = [] }: { activities: any[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center space-x-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent activities</p>
          ) : (
            activities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start space-x-3 text-xs">
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarImage src={act.user?.avatar} />
                  <AvatarFallback>{act.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <p className="text-slate-800 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-white">{act.user?.name || 'User'}</span>{' '}
                    {act.action} <span className="font-medium text-indigo-600 dark:text-indigo-400">{act.entityType}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
