import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await notificationService.getNotifications(req.user!.id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationService.markAsRead(req.params.notificationId);
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
