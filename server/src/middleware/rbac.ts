import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import prisma from '../config/db';
import { GlobalRole, ProjectRole } from '@prisma/client';

export const requireGlobalRole = (...roles: GlobalRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.globalRole)) {
      return next(new AppError('Forbidden', 403));
    }
    next();
  };
};

export const requireProjectRole = (...roles: ProjectRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const projectId = req.params.projectId;
      if (!projectId) {
        throw new AppError('Project ID is required', 400);
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!membership || !roles.includes(membership.role)) {
        throw new AppError('Forbidden: Insufficient project role', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
