import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/db';
import { AppError } from './errorHandler';
import { GlobalRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        globalRole: GlobalRole;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, globalRole: true },
    });

    if (!user) {
      throw new AppError('Invalid token', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401));
  }
};
