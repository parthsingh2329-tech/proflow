import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { config } from '../config/env';

let io: Server;

export const setupSocketIO = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = verifyAccessToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.user.userId}`);
    
    // Join personal room for user-specific notifications
    socket.join(`user_${socket.data.user.userId}`);

    socket.on('join-project', (projectId: string) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.data.user.userId} joined project ${projectId}`);
    });

    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.data.user.userId} left project ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('Socket.io is not initialized yet');
  }
  return io;
};
