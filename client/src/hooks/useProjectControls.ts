import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Risk, Issue, Decision, ProjectBaseline } from '@/types';

// ==========================================
// 1. RISKS HOOKS
// ==========================================

export const useProjectRisks = (projectId?: string) => {
  return useQuery<Risk[]>({
    queryKey: ['risks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/risks`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateRisk = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Risk>) => {
      const res = await api.post(`/projects/${projectId}/risks`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      toast.success('Risk logged in register');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to log risk');
    },
  });
};

export const useUpdateRisk = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ riskId, data }: { riskId: string; data: Partial<Risk> }) => {
      const res = await api.patch(`/projects/risks/${riskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      toast.success('Risk updated');
    },
  });
};

export const useDeleteRisk = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (riskId: string) => {
      await api.delete(`/projects/risks/${riskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', projectId] });
      toast.success('Risk removed from register');
    },
  });
};

// ==========================================
// 2. ISSUES HOOKS
// ==========================================

export const useProjectIssues = (projectId?: string) => {
  return useQuery<Issue[]>({
    queryKey: ['issues', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/issues`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Issue>) => {
      const res = await api.post(`/projects/${projectId}/issues`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      toast.success('Issue logged in register');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to log issue');
    },
  });
};

export const useUpdateIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, data }: { issueId: string; data: Partial<Issue> }) => {
      const res = await api.patch(`/projects/issues/${issueId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      toast.success('Issue updated');
    },
  });
};

export const useDeleteIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (issueId: string) => {
      await api.delete(`/projects/issues/${issueId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      toast.success('Issue deleted');
    },
  });
};

// ==========================================
// 3. DECISIONS HOOKS
// ==========================================

export const useProjectDecisions = (projectId?: string) => {
  return useQuery<Decision[]>({
    queryKey: ['decisions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/decisions`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateDecision = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Decision>) => {
      const res = await api.post(`/projects/${projectId}/decisions`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', projectId] });
      toast.success('Decision recorded in log');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record decision');
    },
  });
};

export const useUpdateDecision = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ decisionId, data }: { decisionId: string; data: Partial<Decision> }) => {
      const res = await api.patch(`/projects/decisions/${decisionId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', projectId] });
      toast.success('Decision updated');
    },
  });
};

export const useDeleteDecision = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (decisionId: string) => {
      await api.delete(`/projects/decisions/${decisionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', projectId] });
      toast.success('Decision removed');
    },
  });
};

// ==========================================
// 4. BASELINES HOOKS
// ==========================================

export const useProjectBaselines = (projectId?: string) => {
  return useQuery<ProjectBaseline[]>({
    queryKey: ['baselines', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/baselines`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useFreezeBaseline = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await api.post(`/projects/${projectId}/baselines`, { name, description });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', projectId] });
      toast.success('Project schedule baseline frozen successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to freeze baseline');
    },
  });
};

export const useDeleteBaseline = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (baselineId: string) => {
      await api.delete(`/projects/baselines/${baselineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baselines', projectId] });
      toast.success('Baseline removed');
    },
  });
};
