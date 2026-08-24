import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { PhaseGate, GateStatus } from '@/types';

export const usePhaseGates = (projectId?: string) => {
  return useQuery<PhaseGate[]>({
    queryKey: ['phaseGates', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/gates`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreatePhaseGate = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PhaseGate>) => {
      const res = await api.post(`/projects/${projectId}/gates`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseGates', projectId] });
      toast.success('Stage Gate created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create Stage Gate');
    },
  });
};

export const useToggleCriteria = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ criteriaId, isMet, evidenceNotes }: { criteriaId: string; isMet: boolean; evidenceNotes?: string }) => {
      const res = await api.patch(`/projects/gates/criteria/${criteriaId}`, { isMet, evidenceNotes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseGates', projectId] });
    },
  });
};

export const useSignOffGate = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ gateId, status, reviewSummary }: { gateId: string; status: GateStatus; reviewSummary?: string }) => {
      const res = await api.post(`/projects/gates/${gateId}/signoff`, { status, reviewSummary });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseGates', projectId] });
      toast.success('Stage Gate sign-off recorded');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sign off gate');
    },
  });
};

export const useDeletePhaseGate = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gateId: string) => {
      await api.delete(`/projects/gates/${gateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phaseGates', projectId] });
      toast.success('Stage Gate removed');
    },
  });
};
