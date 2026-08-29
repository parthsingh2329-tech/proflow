import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  X, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  MessageSquare, 
  Clock, 
  Paperclip,
  CheckCircle2,
  Diamond,
  Link2,
  Plus,
  Zap,
  ArrowRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Task, ProjectMember, DependencyType } from '@/types';
import { useUpdateTask, useDeleteTask, useTasks, useCreateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { wouldCreateCycle } from '@/lib/cpm';
import SubtaskList from './SubtaskList';

interface TaskDetailModalProps {
  taskId: string | null;
  projectId: string;
  onClose: () => void;
}

const DEPENDENCY_TYPES: { type: DependencyType; label: string; desc: string }[] = [
  { type: 'FS', label: 'Finish-to-Start (FS)', desc: 'This task can only start after predecessor finishes' },
  { type: 'SS', label: 'Start-to-Start (SS)', desc: 'This task starts together with predecessor' },
  { type: 'FF', label: 'Finish-to-Finish (FF)', desc: 'This task finishes together with predecessor' },
  { type: 'SF', label: 'Start-to-Finish (SF)', desc: 'This task finishes after predecessor starts' },
];

export default function TaskDetailModal({ taskId, projectId, onClose }: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commentText, setCommentText] = useState('');

  // Dependency form state
  const [selectedPredId, setSelectedPredId] = useState('');
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('FS');
  const [lagDays, setLagDays] = useState<number>(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch full task details
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await api.get<Task>(`/tasks/${taskId}`);
      return res.data;
    },
    enabled: !!taskId,
  });

  // Fetch all tasks in project for predecessor selector & capacity
  const { data: projectTasks = [] } = useTasks(projectId);

  // Fetch project members for assignment
  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  // Add Dependency Mutation
  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !selectedPredId) return;

      // Check for cycles before making the request
      if (wouldCreateCycle(selectedPredId, taskId, projectTasks as Task[])) {
        throw new Error('Circular dependency detected: Adding this link creates a closed loop in the project CPM schedule.');
      }

      await api.post(`/tasks/${taskId}/dependencies`, {
        predecessorId: selectedPredId,
        type: selectedDepType,
        lagDays: Number(lagDays) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setSelectedPredId('');
      setLagDays(0);
      toast.success('CPM Dependency linked');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to add dependency');
    },
  });

  // Delete Dependency Mutation
  const removeDependencyMutation = useMutation({
    mutationFn: async (depId: string) => {
      await api.delete(`/tasks/${taskId}/dependencies/${depId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Dependency removed');
    },
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  if (!taskId) return null;

  const handleUpdate = (data: Partial<Task>) => {
    // Validate dates
    if (data.startDate && task?.dueDate && new Date(task.dueDate) < new Date(data.startDate)) {
      toast.error('Start date cannot be after due date');
      return;
    }
    if (data.dueDate && task?.startDate && new Date(data.dueDate) < new Date(task.startDate)) {
      toast.error('Due date cannot precede start date');
      return;
    }
    if (data.estimatedHours !== undefined && Number(data.estimatedHours) < 0) {
      toast.error('Estimated hours cannot be negative');
      return;
    }

    updateTask.mutate({ id: taskId, data });
  };

  const handleTitleBlur = () => {
    if (task && title.trim() && title !== task.title) {
      handleUpdate({ title: title.trim().slice(0, 200) });
    }
  };

  const handleDescriptionBlur = () => {
    if (task && description !== task.description) {
      handleUpdate({ description });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${task?.title}"?`)) {
      const taskBackup = { ...task };
      deleteTask.mutate(
        { id: taskId, projectId },
        {
          onSuccess: () => {
            onClose();
            // 5-second Undo toast
            toast((t) => (
              <div className="flex items-center space-x-3 text-xs">
                <span>Task deleted.</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (taskBackup) {
                      createTask.mutate({
                        title: taskBackup.title,
                        description: taskBackup.description,
                        priority: taskBackup.priority,
                        status: taskBackup.status,
                        startDate: taskBackup.startDate,
                        dueDate: taskBackup.dueDate,
                        estimatedHours: taskBackup.estimatedHours,
                        assigneeId: taskBackup.assigneeId,
                        columnId: taskBackup.columnId,
                        projectId,
                      });
                    }
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 underline"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Undo
                </button>
              </div>
            ), { duration: 6000 });
          },
        }
      );
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: commentText.trim() });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    } catch {
      // handled
    }
  };

  const members: ProjectMember[] = project?.members || [];

  // Filter candidate predecessors: exclude self and tasks that would create a circular dependency
  const candidatePredecessors = (projectTasks as Task[]).filter((t: Task) => {
    if (t.id === taskId) return false;
    return !wouldCreateCycle(t.id, taskId, projectTasks as Task[]);
  });

  const predecessors = task?.dependenciesAsSuccessor || [];
  const successors = task?.dependenciesAsPredecessor || [];

  // Time-phased capacity check for selected assignee
  const getAssigneeCapacityWarning = (assigneeId: string | null) => {
    if (!assigneeId) return null;
    const allAssigned = (projectTasks as Task[]).filter((t) => t.assigneeId === assigneeId);
    
    // Time-phase task hours over duration weeks
    const weeklyRate = allAssigned.reduce((acc, t) => {
      const start = t.startDate ? new Date(t.startDate) : new Date();
      const due = t.dueDate ? new Date(t.dueDate) : new Date(start.getTime() + 14 * 86400000);
      const diffDays = Math.max(1, Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const durationWeeks = Math.max(1, Math.round(diffDays / 7));
      const hours = t.estimatedHours || 8;
      return acc + (hours / durationWeeks);
    }, 0);

    const roundedWeekly = Number(weeklyRate.toFixed(1));
    if (roundedWeekly > 40) {
      return { weeklyRate: roundedWeekly, isOverloaded: true };
    }
    return null;
  };

  const capacityWarning = getAssigneeCapacityWarning(task?.assigneeId || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop with Click to Close */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onClose} 
      />

      <div className="relative z-50 flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            {task?.isMilestone && (
              <span className="flex items-center rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                <Diamond className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" /> APQP Milestone Gate
              </span>
            )}
            <Badge variant="outline" className="text-xs font-semibold">
              {task?.status || 'Task Details'}
            </Badge>
            {task?.wbsNode && (
              <Badge variant="secondary" className="text-xs font-mono">
                WBS: {task.wbsNode.wbsCode}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Delete Task"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close (Esc)">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : task ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Content Column (65%) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title with Character Counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Task Title</span>
                  <span className={`text-[10px] font-mono ${title.length >= 180 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                    {title.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full text-lg font-bold bg-transparent border-b border-slate-200 focus:border-indigo-500 focus:outline-none dark:border-slate-700 px-1 py-1 text-slate-900 dark:text-white"
                  placeholder="Task Title (e.g. 800V SiC Power Stage Testing)"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description & Engineering Specs
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  rows={3}
                  className="w-full text-sm resize-none"
                  placeholder="Add detailed engineering specifications, acceptance criteria, or testing notes..."
                />
              </div>

              {/* ========================================================= */}
              {/* CPM DEPENDENCIES SECTION (With Cycle Detection)           */}
              {/* ========================================================= */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    <Link2 className="h-4 w-4 text-indigo-600" />
                    <span>CPM Task Dependencies ({predecessors.length})</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Cycle Protected
                  </span>
                </div>

                {/* Predecessors List */}
                <div className="space-y-2">
                  {predecessors.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No predecessor dependencies linked yet.</p>
                  ) : (
                    predecessors.map((dep: any) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Badge variant="outline" className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                            {dep.type}
                          </Badge>
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {dep.predecessor?.title}
                          </span>
                          {dep.lagDays !== 0 && (
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              ({dep.lagDays > 0 ? `+${dep.lagDays}d lag` : `${dep.lagDays}d lead`})
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDependencyMutation.mutate(dep.id)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Dependency Form */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    + Link Predecessor Activity
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <Select
                        value={selectedPredId}
                        onChange={(e) => setSelectedPredId(e.target.value)}
                        className="text-xs h-8"
                      >
                        <option value="">Select Predecessor Task...</option>
                        {candidatePredecessors.map((t: Task) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="sm:col-span-3">
                      <Select
                        value={selectedDepType}
                        onChange={(e) => setSelectedDepType(e.target.value as DependencyType)}
                        className="text-xs h-8"
                      >
                        <option value="FS">FS (Finish-Start)</option>
                        <option value="SS">SS (Start-Start)</option>
                        <option value="FF">FF (Finish-Finish)</option>
                        <option value="SF">SF (Start-Finish)</option>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Lag (d)"
                        value={lagDays}
                        onChange={(e) => setLagDays(Number(e.target.value))}
                        className="text-xs h-8 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Button
                        size="sm"
                        disabled={!selectedPredId || addDependencyMutation.isPending}
                        onClick={() => addDependencyMutation.mutate()}
                        className="h-8 w-full px-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <SubtaskList task={task} projectId={projectId} />

              {/* Comments */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Activity Comments ({task.comments?.length || 0})
                </label>
                <div className="space-y-3">
                  {task.comments?.map((c: any) => (
                    <div key={c.id} className="flex space-x-3 text-xs">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.user?.avatar} />
                        <AvatarFallback>{c.user?.name?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
                        <div className="flex items-center justify-between font-medium">
                          <span>{c.user?.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex space-x-2 pt-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="text-xs h-8"
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
                    Post
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Attributes Sidebar (35%) */}
            <div className="w-72 border-l border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20 space-y-5 overflow-y-auto">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Status</label>
                <Select
                  value={task.status}
                  onChange={(e) => handleUpdate({ status: e.target.value as any })}
                  className="text-xs h-8"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Priority</label>
                <Select
                  value={task.priority}
                  onChange={(e) => handleUpdate({ priority: e.target.value as any })}
                  className="text-xs h-8"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </Select>
              </div>

              {/* Assignee with Capacity Alert */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500">Assignee Lead</label>
                  {capacityWarning && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> Overload ({capacityWarning.weeklyRate}h/wk)
                    </span>
                  )}
                </div>
                <Select
                  value={task.assigneeId || ''}
                  onChange={(e) => handleUpdate({ assigneeId: e.target.value || undefined })}
                  className="text-xs h-8"
                >
                  <option value="">Unassigned</option>
                  {members.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Start Date & Due Date Validation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Start Date</label>
                <Input
                  type="date"
                  value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="text-xs h-8 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Target Due Date</label>
                <Input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  min={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : undefined}
                  onChange={(e) => handleUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="text-xs h-8 font-mono"
                />
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Estimated Effort (Hours)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.estimatedHours || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    handleUpdate({ estimatedHours: val });
                  }}
                  className="text-xs h-8 font-mono"
                  placeholder="e.g. 40"
                />
              </div>

              {/* Milestone Flag */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                    APQP Stage Gate
                  </span>
                  <span className="text-[10px] text-slate-400">Designates a zero-duration gate sign-off</span>
                </div>
                <Switch
                  checked={task.isMilestone}
                  onCheckedChange={(checked) => handleUpdate({ isMilestone: checked })}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
