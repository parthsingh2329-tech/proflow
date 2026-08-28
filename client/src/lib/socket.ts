import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export const connectSocket = (token: string) => {
  if (socket) return socket;
  
  const socketUrl = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  
  socket = io(socketUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 4000,
    transports: ['websocket', 'polling'],
  });
  
  socket.on('connect', () => {
    reconnectAttempts = 0;
  });

  socket.on('connect_error', () => {
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && socket) {
      // Gracefully stop reconnection loop when serverless backend has no persistent socket
      socket.disconnect();
    }
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

export const getSocket = () => socket;
