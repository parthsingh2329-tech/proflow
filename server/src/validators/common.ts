import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ status: 'error', errors: error.errors });
      } else {
        next(error);
      }
    }
  };
};

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
});

export const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
});

export const createTimeEntrySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
});

export const queryParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
