import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ProjectBudget, BudgetCostItem } from '@/types';

export const useProjectBudget = (projectId?: string) => {
  return useQuery<ProjectBudget>({
    queryKey: ['budget', projectId],
    queryFn: async () => {
      if (!projectId) return null as any;
      const res = await api.get<ProjectBudget>(`/projects/${projectId}/budget`);
      return res.data;
    },
    enabled: !!projectId,
  });
};

export const useUpdateBudget = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProjectBudget>) => {
      const res = await api.patch(`/projects/${projectId}/budget`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Project budget updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update budget');
    },
  });
};

export const useAddCostItem = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BudgetCostItem>) => {
      const res = await api.post(`/projects/${projectId}/budget/items`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Cost item added to ledger');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add cost item');
    },
  });
};

export const useUpdateCostItem = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ costItemId, data }: { costItemId: string; data: Partial<BudgetCostItem> }) => {
      const res = await api.patch(`/projects/budget/items/${costItemId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Cost item updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update cost item');
    },
  });
};

export const useDeleteCostItem = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (costItemId: string) => {
      await api.delete(`/projects/budget/items/${costItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Cost item removed');
    },
  });
};
