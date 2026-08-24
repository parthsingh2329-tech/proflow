import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { User, AuthResponse } from '@/types';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, setAuth, logout: storeLogout, setUser } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check credentials.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created successfully!');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Registration failed.');
    },
  });

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    storeLogout();
    queryClient.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const res = await api.get<{ user: User }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
      return res.data?.user;
    },
    enabled: !!accessToken,
    retry: false,
  });

  return {
    user: profileData || user,
    isAuthenticated,
    isProfileLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout,
  };
};
