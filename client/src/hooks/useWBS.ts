import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { WBSNode } from '@/types';

export const useWBS = (projectId?: string) => {
  return useQuery<WBSNode[]>({
    queryKey: ['wbs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/wbs`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateWBSNode = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<WBSNode>) => {
      const res = await api.post(`/projects/${projectId}/wbs`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbs', projectId] });
      toast.success('WBS node added to hierarchy');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create WBS node');
    },
  });
};

export const useUpdateWBSNode = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nodeId, data }: { nodeId: string; data: Partial<WBSNode> }) => {
      const res = await api.patch(`/projects/wbs/${nodeId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbs', projectId] });
      toast.success('WBS node updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update WBS node');
    },
  });
};

export const useDeleteWBSNode = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nodeId: string) => {
      await api.delete(`/projects/wbs/${nodeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbs', projectId] });
      toast.success('WBS node deleted');
    },
  });
};

export const usePromoteTaskToWBS = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, parentNodeId }: { taskId: string; parentNodeId: string }) => {
      const res = await api.post(`/projects/${projectId}/wbs/promote-task`, { taskId, parentNodeId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wbs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task promoted to WBS node successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to promote task');
    },
  });
};
