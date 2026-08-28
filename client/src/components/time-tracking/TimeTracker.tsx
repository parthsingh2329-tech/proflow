import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Square, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  FileText,
  Download,
  History,
  Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { Task, TimeEntry } from '@/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TimeTrackerProps {
  tasks: Task[];
  projectId?: string;
}

export default function TimeTracker({ tasks = [], projectId }: TimeTrackerProps) {
  const queryClient = useQueryClient();

  // Timer State
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);

  // Manual Log Form State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState<number>(1);
  const [manualMinutes, setManualMinutes] = useState<number>(0);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState('');

  // Fetch Project Time Entries
  const { data: timeEntries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['time-entries', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<TimeEntry[]>(`/time-entries/project/${projectId}/list`);
      return res.data;
    },
    enabled: !!projectId,
  });

  // Delete Mutation
  const deleteTimeEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await api.delete(`/time-entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', projectId] });
      toast.success('Time entry deleted');
    },
    onError: () => toast.error('Failed to delete time entry'),
  });

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    if (!selectedTaskId) {
      toast.error('Please select a task to track');
      return;
    }
    setIsRunning(true);
    setStartTime(new Date().toISOString());
  };

  const handleStop = async () => {
    setIsRunning(false);
    const endTime = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round(seconds / 60));

    try {
      await api.post(`/tasks/${selectedTaskId}/time-entries`, {
        startTime: startTime || new Date().toISOString(),
        endTime,
        duration: durationMinutes,
        description: description.trim() || 'Live tracked session',
      });
      toast.success(`Logged ${durationMinutes} min (${(durationMinutes / 60).toFixed(1)} hrs) to task!`);
      setSeconds(0);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['time-entries', projectId] });
    } catch {
      toast.error('Failed to save time entry');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTaskId) {
      toast.error('Please select a task');
      return;
    }

    const totalMinutes = Math.max(1, Math.round(Number(manualHours) * 60 + Number(manualMinutes)));
    const entryDate = new Date(manualDate || Date.now());

    try {
      await api.post(`/tasks/${manualTaskId}/time-entries`, {
        startTime: entryDate.toISOString(),
        endTime: new Date(entryDate.getTime() + totalMinutes * 60000).toISOString(),
        duration: totalMinutes,
        description: manualDescription.trim() || 'Manual time log',
      });
      toast.success(`Logged ${totalMinutes} min to task!`);
      setIsManualModalOpen(false);
      setManualHours(1);
      setManualMinutes(0);
      setManualDescription('');
      queryClient.invalidateQueries({ queryKey: ['time-entries', projectId] });
    } catch {
      toast.error('Failed to log manual time');
    }
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalLoggedMinutes = timeEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalLoggedHours = (totalLoggedMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Stopwatch Card */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
              <Timer className="h-4 w-4 text-indigo-600" />
              <span>Interactive Time Tracker & Timesheet</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs h-7 space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Time Manually</span>
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Timer display */}
            <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {isRunning ? 'Active Tracking Session' : 'Ready to Track'}
                  </span>
                  <span className="font-mono text-3xl font-black tracking-wider text-slate-900 dark:text-white">
                    {formatTime(seconds)}
                  </span>
                </div>
              </div>

              <div>
                {isRunning ? (
                  <Button onClick={handleStop} variant="destructive" className="space-x-1.5 text-xs font-semibold h-10 px-5 shadow-sm">
                    <Square className="h-4 w-4 fill-current" />
                    <span>Stop & Record</span>
                  </Button>
                ) : (
                  <Button onClick={handleStart} className="space-x-1.5 text-xs font-semibold h-10 px-5 shadow-sm">
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Timer</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Task selector & description input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Activity / Task *</label>
                <Select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  disabled={isRunning}
                  className="text-xs h-8"
                >
                  <option value="">Select Project Activity...</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.status})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Session Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dyno calibration run 4, inverter thermal logging"
                  className="text-xs h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="p-5 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Project Effort Logged</span>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalLoggedHours} <span className="text-base font-normal text-slate-400">hours</span>
            </h4>
            <span className="text-xs text-slate-500 mt-1 block">
              Across {timeEntries.length} recorded timesheet entries
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Audited APQP timesheet</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              Effort Ledger
            </Badge>
          </div>
        </Card>
      </div>

      {/* Logged Time Entries History Table */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <History className="h-4 w-4 text-indigo-500 mr-1" />
            <span>Logged Time Entries & Activity History ({timeEntries.length})</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No time entries logged yet. Use the timer above or click "Log Time Manually" to record engineering hours.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                    <th className="p-3 pl-4">Team Member</th>
                    <th className="p-3">Activity / Task</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3">Description / Work Notes</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {timeEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.user?.avatar} />
                            <AvatarFallback>{entry.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {entry.user?.name || 'Engineer'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                        {entry.task?.title || 'Unknown Task'}
                      </td>

                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {entry.duration ? `${(entry.duration / 60).toFixed(1)} hrs (${entry.duration}m)` : '-'}
                      </td>

                      <td className="p-3 text-slate-500 font-mono">
                        {entry.startTime ? format(new Date(entry.startTime), 'MMM d, yyyy') : '-'}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {entry.description || 'No description'}
                      </td>

                      <td className="p-3 text-right pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Delete this logged time entry?')) {
                              deleteTimeEntryMutation.mutate(entry.id);
                            }
                          }}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Time Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsManualModalOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 text-indigo-600 mr-2" />
              Log Time Entry Manually
            </h3>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Activity *</label>
                <Select
                  value={manualTaskId}
                  onChange={(e) => setManualTaskId(e.target.value)}
                  required
                  className="text-xs h-8"
                >
                  <option value="">Select Task...</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hours</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="text-xs h-8 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date Worked *</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="text-xs h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Work Description / Deliverables</label>
                <Textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="e.g. Conducted 4 hours of hardware-in-the-loop (HIL) simulation test runs..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Time Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
