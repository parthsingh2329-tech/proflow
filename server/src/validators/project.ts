import { z } from 'zod';
import { ProjectRole } from '@prisma/client';
export { validate } from './common';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export const updateMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});
