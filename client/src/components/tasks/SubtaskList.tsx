import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SubtaskListProps {
  task: Task;
  projectId: string;
}

export default function SubtaskList({ task, projectId }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const queryClient = useQueryClient();

  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post(`/tasks/${task.id}/subtasks`, { title, projectId });
      return res.data;
    },
    onSuccess: () => {
      setNewSubtaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'DONE' ? 'TODO' : 'DONE';
      const res = await api.patch(`/tasks/${id}`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtaskMutation.mutate(newSubtaskTitle.trim());
  };

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((s) => s.status === 'DONE').length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Checklist ({completedCount}/{subtasks.length})
        </h4>
        {subtasks.length > 0 && (
          <span className="text-xs font-medium text-slate-400">{progressPercent}%</span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Subtask items */}
      <div className="space-y-1.5">
        {subtasks.map((subtask) => {
          const isDone = subtask.status === 'DONE';
          return (
            <div
              key={subtask.id}
              className="group flex items-center justify-between rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, status: subtask.status })}
                className="flex items-center space-x-2 text-xs text-left"
              >
                {isDone ? (
                  <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <span className={isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}>
                  {subtask.title}
                </span>
              </button>
              <button
                type="button"
                onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add subtask form */}
      <form onSubmit={handleAdd} className="flex items-center space-x-2 pt-1">
        <Input
          placeholder="Add an item..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          className="text-xs h-8"
        />
        <Button type="submit" size="sm" className="h-8 text-xs shrink-0" disabled={addSubtaskMutation.isPending}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </form>
    </div>
  );
}
