import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user!.id);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const getProjectAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await dashboardService.getProjectAnalytics(req.params.projectId);
    res.status(200).json(analytics);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await dashboardService.getRecentActivity(req.user!.id, limit);
    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
};
