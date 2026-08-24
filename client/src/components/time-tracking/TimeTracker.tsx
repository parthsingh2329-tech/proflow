import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Task } from '@/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TimeTracker({ tasks = [] }: { tasks: Task[] }) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);

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
      toast.error('Please select a task first');
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
        description: description || 'Tracked session',
      });
      toast.success(`Logged ${durationMinutes} min to task!`);
      setSeconds(0);
      setDescription('');
    } catch {
      toast.error('Failed to log time');
    }
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center space-x-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span>Time Tracker</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer display */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4 dark:bg-slate-800/80">
          <span className="font-mono text-3xl font-bold tracking-wider text-slate-900 dark:text-white">
            {formatTime(seconds)}
          </span>
          {isRunning ? (
            <Button onClick={handleStop} variant="destructive" className="space-x-1.5 text-xs font-semibold">
              <Square className="h-4 w-4 fill-current" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button onClick={handleStart} className="space-x-1.5 text-xs font-semibold">
              <Play className="h-4 w-4 fill-current" />
              <span>Start Timer</span>
            </Button>
          )}
        </div>

        {/* Task selection & description */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Select Task</label>
            <Select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={isRunning}
              className="text-xs"
            >
              <option value="">Choose a task to track...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Notes (optional)</label>
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
