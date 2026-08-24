import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket) return socket;
  
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
