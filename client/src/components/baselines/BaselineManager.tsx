import { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  History
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Task, ProjectBaseline } from '@/types';
import { useProjectBaselines, useFreezeBaseline, useDeleteBaseline } from '@/hooks/useProjectControls';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface BaselineManagerProps {
  projectId: string;
}

export default function BaselineManager({ projectId }: BaselineManagerProps) {
  const { data: baselines = [], isLoading } = useProjectBaselines(projectId);
  const { data: currentTasks = [] } = useTasks(projectId);
  const freezeBaselineMutation = useFreezeBaseline(projectId);
  const deleteBaselineMutation = useDeleteBaseline(projectId);

  const [isFreezeOpen, setIsFreezeOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');

  const activeBaseline = baselines.find((b) => b.id === (selectedBaselineId || baselines[0]?.id)) || baselines[0];

  const handleFreeze = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Baseline name is required');
      return;
    }

    const conflict = baselines.find((b) => b.name.toLowerCase() === trimmedName.toLowerCase());
    if (conflict) {
      toast.error(`A baseline named "${trimmedName}" already exists. Please choose a distinct version identifier (e.g. T1, T2).`);
      return;
    }

    freezeBaselineMutation.mutate({ name: trimmedName, description: description.trim() }, {
      onSuccess: () => {
        setName('');
        setDescription('');
        setIsFreezeOpen(false);
        toast.success(`Schedule baseline "${trimmedName}" frozen`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to freeze baseline');
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Bookmark className="h-5 w-5 text-indigo-600 mr-2" />
            Project Baseline Schedule & Slippage Variance Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Freeze schedule baselines (T0, T1, T2) to track schedule deviation, forecast slip, and scope creep.
          </p>
        </div>

        <Button onClick={() => setIsFreezeOpen(true)} className="h-9 text-xs font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Freeze Current Schedule Baseline
        </Button>
      </div>

      {baselines.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-400 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          No baseline snapshots saved yet. Click "Freeze Current Schedule Baseline" to snapshot the current plan as Target Baseline T0.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Baseline Selector Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {baselines.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBaselineId(b.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-2 border ${
                  activeBaseline?.id === b.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{b.name}</span>
                <span className="text-[10px] opacity-75">
                  ({format(new Date(b.createdAt), 'MMM d')})
                </span>
              </button>
            ))}
          </div>

          {/* Active Baseline Details Card */}
          {activeBaseline && (
            <Card className="p-5 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      FROZEN BASELINE
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeBaseline.name}
                    </h4>
                  </div>
                  {activeBaseline.description && (
                    <p className="text-xs text-slate-500 mt-1">{activeBaseline.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400">
                    Snapshotted on {format(new Date(activeBaseline.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm('Delete this baseline snapshot?')) {
                        deleteBaselineMutation.mutate(activeBaseline.id);
                      }
                    }}
                    className="h-7 w-7 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Task Baseline vs Live Forecast Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-300">
                      <th className="p-3 pl-4">Task Name</th>
                      <th className="p-3">Baseline Target Date</th>
                      <th className="p-3">Current Live Due Date</th>
                      <th className="p-3 text-center">Schedule Variance (Δ)</th>
                      <th className="p-3">Baseline Effort</th>
                      <th className="p-3">Live Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeBaseline.tasks.map((tb) => {
                      const liveTask = (currentTasks as Task[]).find((t: Task) => t.id === tb.taskId);
                      const baseDue = tb.dueDate ? new Date(tb.dueDate) : null;
                      const liveDue = liveTask?.dueDate ? new Date(liveTask.dueDate) : null;
                      const hasBothDates = !!baseDue && !!liveDue;
                      const slippageDays = hasBothDates ? differenceInDays(liveDue, baseDue) : null;

                      return (
                        <tr
                          key={tb.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-white">
                            {liveTask?.title || tb.task?.title || 'Unknown Task'}
                          </td>

                          <td className="p-3 text-slate-500 font-mono">
                            {baseDue ? format(baseDue, 'MMM d, yyyy') : 'No target'}
                          </td>

                          <td className="p-3 font-semibold font-mono text-slate-900 dark:text-slate-100">
                            {liveDue ? format(liveDue, 'MMM d, yyyy') : 'Not set'}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {!hasBothDates ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                No baseline set
                              </span>
                            ) : slippageDays === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> On Baseline (0d)
                              </span>
                            ) : slippageDays! > 0 ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  slippageDays! > 5
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                <TrendingUp className="h-3 w-3 mr-1" /> +{slippageDays}d Slippage
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                <TrendingDown className="h-3 w-3 mr-1" /> {slippageDays}d Ahead
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono text-slate-500">
                            {tb.estimatedHours ? `${tb.estimatedHours} hrs` : '-'}
                          </td>

                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {liveTask?.status || 'TODO'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Freeze Baseline Dialog */}
      {isFreezeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFreezeOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Bookmark className="h-5 w-5 text-indigo-600 mr-2" />
              Freeze New Baseline Schedule Snapshot
            </h3>

            <form onSubmit={handleFreeze} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Baseline Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Baseline T1 — Post-Design Freeze Plan"
                  required
                  className="text-xs"
                />
                {name.trim() && baselines.find((b) => b.name.toLowerCase() === name.trim().toLowerCase()) && (
                  <span className="text-[10px] text-rose-500 font-semibold block">
                    ⚠️ A baseline named "{name.trim()}" already exists. Please choose a distinct version (e.g. T1, T2).
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description / Rationale</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this baseline being frozen (e.g. approved milestone gate)..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFreezeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Freeze Baseline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
