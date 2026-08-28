import React from 'react';
import { format } from 'date-fns';
import { Clock, User, Trash2 } from 'lucide-react';
import { TimeEntry } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface TimeEntryListProps {
  entries: TimeEntry[];
  onDelete?: (entryId: string) => void;
}

export default function TimeEntryList({ entries = [], onDelete }: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 italic">
        No time entries recorded for this activity.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {entries.map((entry: any) => (
        <div key={entry.id} className="flex items-center justify-between p-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={entry.user?.avatar} />
              <AvatarFallback>{entry.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                {entry.user?.name || 'Engineer'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {entry.startTime ? format(new Date(entry.startTime), 'MMM d, yyyy') : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {entry.duration ? `${(entry.duration / 60).toFixed(1)} hrs` : '-'}
            </span>

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry.id)}
                className="h-6 w-6 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
