import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ChangeRequest, ECOStatus } from '@/types';

export const useChangeRequests = (projectId?: string) => {
  return useQuery<ChangeRequest[]>({
    queryKey: ['changeRequests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/changes`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateChangeRequest = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ChangeRequest>) => {
      const res = await api.post(`/projects/${projectId}/changes`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
      toast.success('Engineering Change Order submitted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit change request');
    },
  });
};

export const useReviewChangeRequest = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ecoId, status }: { ecoId: string; status: ECOStatus }) => {
      const res = await api.post(`/projects/changes/${ecoId}/review`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['controls', projectId] });
      toast.success('Change request status updated and schedule synced to Gantt!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update review status');
    },
  });
};

export const useDeleteChangeRequest = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ecoId: string) => {
      await api.delete(`/projects/changes/${ecoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests', projectId] });
      toast.success('Change request deleted');
    },
  });
};
