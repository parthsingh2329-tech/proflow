import prisma from '../config/db';
import { NotificationType } from '@prisma/client';
import { getIO } from '../sockets';

export const getNotifications = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  
  return { notifications, total, page, totalPages: Math.ceil(total / limit) };
};

export const createNotification = async (data: { userId: string, type: NotificationType, title: string, message: string, relatedEntityType?: string, relatedEntityId?: string }) => {
  const notification = await prisma.notification.create({ data });
  
  const io = getIO();
  if (io) {
    io.to(`user_${data.userId}`).emit('notification', notification);
  }
  
  return notification;
};

export const markAsRead = async (notificationId: string) => {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};
