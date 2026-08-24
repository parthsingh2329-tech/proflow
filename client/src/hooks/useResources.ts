import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { ResourceMember, EquipmentResource } from '@/types';

export const useProjectResources = (projectId?: string) => {
  return useQuery<ResourceMember[]>({
    queryKey: ['resources', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/resources`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useUpdateResourceProfile = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res = await api.patch(`/projects/${projectId}/resources/${userId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', projectId] });
      toast.success('Resource profile updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });
};

// EQUIPMENT HOOKS
export const useEquipment = (projectId?: string) => {
  return useQuery<EquipmentResource[]>({
    queryKey: ['equipment', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await api.get<any>(`/projects/${projectId}/equipment`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!projectId,
  });
};

export const useCreateEquipment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<EquipmentResource>) => {
      const res = await api.post(`/projects/${projectId}/equipment`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
      toast.success('Equipment test rig registered');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register equipment');
    },
  });
};

export const useUpdateEquipment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ equipmentId, data }: { equipmentId: string; data: Partial<EquipmentResource> }) => {
      const res = await api.patch(`/projects/equipment/${equipmentId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
      toast.success('Equipment record updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update equipment');
    },
  });
};

export const useDeleteEquipment = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (equipmentId: string) => {
      await api.delete(`/projects/equipment/${equipmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
      toast.success('Equipment record removed');
    },
  });
};
