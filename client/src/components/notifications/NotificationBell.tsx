import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Notification } from '@/types';
import { useSocket } from '@/hooks/useSocket';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<any>('/notifications');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.notifications)) return res.data.notifications;
      return [];
    },
  });

  const notifications: Notification[] = Array.isArray(notificationsData) ? notificationsData : [];

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return () => {
      socket.off('notification');
    };
  }, [socket, queryClient]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-2.5 px-1 flex flex-col space-y-1 transition-colors ${
                      !n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
