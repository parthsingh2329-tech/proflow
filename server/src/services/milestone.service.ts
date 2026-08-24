import prisma from '../config/db';
import { TaskStatus } from '@prisma/client';

export const getMilestones = async (projectId: string) => {
  return prisma.milestone.findMany({
    where: { projectId },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        where: { status: TaskStatus.DONE },
        select: { id: true }
      }
    },
  }).then(milestones => 
    milestones.map(m => ({
      ...m,
      completedTaskCount: m.tasks.length,
      tasks: undefined
    }))
  );
};

export const createMilestone = async (projectId: string, data: any) => {
  return prisma.milestone.create({ data: { ...data, projectId } });
};

export const updateMilestone = async (milestoneId: string, data: any) => {
  return prisma.milestone.update({ where: { id: milestoneId }, data });
};

export const deleteMilestone = async (milestoneId: string) => {
  return prisma.milestone.delete({ where: { id: milestoneId } });
};
