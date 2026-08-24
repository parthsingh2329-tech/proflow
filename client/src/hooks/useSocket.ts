import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

export const useSocket = (projectId?: string) => {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const socket = connectSocket(accessToken);
      if (projectId && socket) {
        socket.emit('join-project', projectId);
      }
      return () => {
        if (projectId && socket) {
          socket.emit('leave-project', projectId);
        }
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, accessToken, projectId]);

  return getSocket();
};
