import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Board, Column } from '@/types';

export const useBoards = (projectId?: string) => {
  return useQuery({
    queryKey: ['boards', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<Board[]>(`/boards/project/${projectId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useColumns = (boardId?: string) => {
  return useQuery({
    queryKey: ['columns', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const res = await api.get<Column[]>(`/boards/${boardId}/columns`);
      return res.data;
    },
    enabled: !!boardId,
  });
};

export const useCreateColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, name, color }: { boardId: string; name: string; color?: string }) => {
      const res = await api.post<Column>(`/boards/${boardId}/columns`, { name, color });
      return res.data;
    },
    onSuccess: (col) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['columns', col.boardId] });
      toast.success('Column added');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add column');
    },
  });
};

export const useUpdateColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Column> }) => {
      const res = await api.patch<Column>(`/columns/${id}`, data);
      return res.data;
    },
    onSuccess: (col) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['columns', col.boardId] });
    },
  });
};

export const useDeleteColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/columns/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Column deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete column');
    },
  });
};
