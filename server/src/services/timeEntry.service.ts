import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const getTimeEntries = async (taskId: string) => {
  return prisma.timeEntry.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const createTimeEntry = async (taskId: string, userId: string, data: any) => {
  const { startTime, endTime, duration: _duration, ...rest } = data;
  let duration = _duration;

  if (startTime && endTime && !duration) {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    duration = Math.floor(diffMs / 60000); // in minutes
  }

  return prisma.timeEntry.create({
    data: {
      ...rest,
      taskId,
      userId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
};

export const updateTimeEntry = async (entryId: string, data: any) => {
  return prisma.timeEntry.update({
    where: { id: entryId },
    data,
  });
};

export const deleteTimeEntry = async (entryId: string) => {
  return prisma.timeEntry.delete({ where: { id: entryId } });
};

export const getProjectTimeReport = async (projectId: string) => {
  const entries = await prisma.timeEntry.findMany({
    where: { task: { projectId } },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  const byUser = entries.reduce((acc: any, entry) => {
    const uid = entry.userId;
    if (!acc[uid]) acc[uid] = { user: entry.user, totalMinutes: 0 };
    acc[uid].totalMinutes += entry.duration || 0;
    return acc;
  }, {});

  const byTask = entries.reduce((acc: any, entry) => {
    const tid = entry.taskId;
    if (!acc[tid]) acc[tid] = { task: entry.task, totalMinutes: 0 };
    acc[tid].totalMinutes += entry.duration || 0;
    return acc;
  }, {});

  return { byUser: Object.values(byUser), byTask: Object.values(byTask) };
};

export const getProjectTimeEntries = async (projectId: string) => {
  return prisma.timeEntry.findMany({
    where: { task: { projectId } },
    include: {
      user: { select: { id: true, name: true, avatar: true, email: true } },
      task: { select: { id: true, title: true, priority: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
