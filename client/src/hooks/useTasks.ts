import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Task } from '@/types';

export const useTasks = (projectId?: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      if (!projectId) return [];
      const params = new URLSearchParams();
      params.append('limit', '500');
      if (filters) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            params.set(key, String(val));
          }
        });
      }
      const res = await api.get<any>(`/projects/${projectId}/tasks?${params.toString()}`);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.tasks)) return res.data.tasks;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    enabled: !!projectId,
  });
};

export const useTask = (id?: string) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<Task>(`/tasks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task> & { projectId: string }) => {
      const res = await api.post<Task>('/tasks', data);
      return res.data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['boards', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await api.patch<Task>(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['boards', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await api.delete(`/tasks/${id}`);
      return { id, projectId };
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    },
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, columnId, order, projectId }: { id: string; columnId: string; order: number; projectId: string }) => {
      const res = await api.patch<Task>(`/tasks/${id}/move`, { columnId, order });
      return { task: res.data, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
};
