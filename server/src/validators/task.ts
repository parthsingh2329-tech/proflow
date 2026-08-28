import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';
export { validate } from './common';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title cannot exceed 200 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().cuid().optional().or(z.literal('')).nullable(),
  columnId: z.string().cuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  parentTaskId: z.string().cuid().optional().nullable(),
  milestoneId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const moveTaskSchema = z.object({
  columnId: z.string().cuid(),
  order: z.number(),
});
