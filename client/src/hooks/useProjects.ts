import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Project, ProjectMember } from '@/types';

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<any>('/projects');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.projects)) return res.data.projects;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const res = await api.get<Project & { members: ProjectMember[]; boards: any[]; labels: any[] }>(`/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; startDate?: string; endDate?: string }) => {
      const res = await api.post<Project>('/projects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create project');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await api.patch<Project>(`/projects/${id}`, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', updated.id] });
      toast.success('Project updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update project');
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: string }) => {
      const res = await api.post(`/projects/${projectId}/members`, { email, role });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects', vars.projectId] });
      toast.success('Member invited successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add member');
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, memberId, role }: { projectId: string; memberId: string; role: string }) => {
      const res = await api.patch(`/projects/${projectId}/members/${memberId}`, { role });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects', vars.projectId] });
      toast.success('Member role updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update member role');
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, memberId }: { projectId: string; memberId: string }) => {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['projects', vars.projectId] });
      toast.success('Member removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    },
  });
};
