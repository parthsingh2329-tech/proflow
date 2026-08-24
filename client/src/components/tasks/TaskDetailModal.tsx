import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Task, ProjectMember, DependencyType } from '@/types';
import { useUpdateTask, useDeleteTask, useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commentText, setCommentText] = useState('');

  // Dependency form state
  const [selectedPredId, setSelectedPredId] = useState('');
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('FS');
  const [lagDays, setLagDays] = useState<number>(0);

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

  // Fetch all tasks in project for predecessor selector
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
    updateTask.mutate({ id: taskId, data });
  };

  const handleTitleBlur = () => {
    if (task && title !== task.title) {
      handleUpdate({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (task && description !== task.description) {
      handleUpdate({ description });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(
        { id: taskId, projectId },
        {
          onSuccess: () => {
            onClose();
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
  const candidatePredecessors = (projectTasks as Task[]).filter((t: Task) => t.id !== taskId);
  const predecessors = task?.dependenciesAsSuccessor || [];
  const successors = task?.dependenciesAsPredecessor || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative z-50 flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            {task?.isMilestone && (
              <span className="flex items-center rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                <Diamond className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" /> Milestone
              </span>
            )}
            <Badge variant="outline" className="text-xs">
              {task?.status || 'Task Details'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
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
              {/* Title */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none dark:hover:border-slate-700 px-1 py-0.5 text-slate-900 dark:text-white"
                  placeholder="Task Title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  rows={3}
                  className="w-full text-sm resize-none"
                  placeholder="Add a detailed description..."
                />
              </div>

              {/* ========================================================= */}
              {/* CPM DEPENDENCIES SECTION (FS, SS, FF, SF Relationships) */}
              {/* ========================================================= */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    <Link2 className="h-4 w-4 text-indigo-600" />
                    <span>CPM Task Dependencies ({predecessors.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">FS • SS • FF • SF</span>
                </div>

                {/* Predecessors List */}
                <div className="space-y-2">
                  {predecessors.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No predecessor dependencies linked yet.</p>
                  ) : (
                    predecessors.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 text-xs shadow-sm"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                            {dep.type}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {dep.predecessor?.title || 'Predecessor Task'}
                          </span>
                          {dep.lagDays !== 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({dep.lagDays > 0 ? `+${dep.lagDays}` : dep.lagDays}d lag)
                            </span>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDependencyMutation.mutate(dep.id)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Dependency Sub-Form */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                  <Select
                    value={selectedPredId}
                    onChange={(e) => setSelectedPredId(e.target.value)}
                    className="text-xs h-8 flex-1"
                  >
                    <option value="">+ Select Predecessor Task...</option>
                    {candidatePredecessors.map((p: Task) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedDepType}
                    onChange={(e) => setSelectedDepType(e.target.value as DependencyType)}
                    className="text-xs h-8 w-32 font-mono"
                  >
                    <option value="FS">FS (Finish-to-Start)</option>
                    <option value="SS">SS (Start-to-Start)</option>
                    <option value="FF">FF (Finish-to-Finish)</option>
                    <option value="SF">SF (Start-to-Finish)</option>
                  </Select>

                  <Input
                    type="number"
                    value={lagDays}
                    onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                    placeholder="Lag (d)"
                    className="text-xs h-8 w-20"
                    title="Lag days (lead/lag offset)"
                  />

                  <Button
                    size="sm"
                    onClick={() => addDependencyMutation.mutate()}
                    disabled={!selectedPredId}
                    className="h-8 text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <SubtaskList task={task} projectId={projectId} />
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span>Activity & Comments</span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {task.comments?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet</p>
                  ) : (
                    task.comments?.map((c: any) => (
                      <div key={c.id} className="flex items-start space-x-3 text-xs">
                        <Avatar className="h-6 w-6 mt-0.5">
                          <AvatarImage src={c.user?.avatar} />
                          <AvatarFallback>{c.user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 dark:text-white">{c.user?.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add comment */}
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs shrink-0">
                    Send
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Meta Column (35%) */}
            <div className="w-80 border-l border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/50 overflow-y-auto space-y-5">
              {/* Milestone Switch Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center space-x-2">
                  <Diamond className="h-4 w-4 text-amber-600 fill-amber-500" />
                  <label htmlFor="is-milestone-toggle" className="text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer">
                    Project Milestone (◆)
                  </label>
                </div>
                <Switch
                  id="is-milestone-toggle"
                  checked={task.isMilestone || false}
                  onCheckedChange={(checked: boolean) => handleUpdate({ isMilestone: checked })}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={task.status}
                  onChange={(e) => handleUpdate({ status: e.target.value as any })}
                  className="text-xs"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Priority
                </label>
                <Select
                  value={task.priority}
                  onChange={(e) => handleUpdate({ priority: e.target.value as any })}
                  className="text-xs"
                >
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🔵 Low</option>
                  <option value="NONE">⚪ None</option>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assignee
                </label>
                <Select
                  value={task.assigneeId || ''}
                  onChange={(e) => handleUpdate({ assigneeId: e.target.value || null as any })}
                  className="text-xs"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    handleUpdate({
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : (null as any),
                    })
                  }
                  className="text-xs h-9"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    handleUpdate({
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : (null as any),
                    })
                  }
                  className="text-xs h-9"
                />
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estimated Hours
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={task.estimatedHours || ''}
                  onChange={(e) =>
                    handleUpdate({ estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="text-xs h-9"
                  placeholder="e.g. 4.5"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
