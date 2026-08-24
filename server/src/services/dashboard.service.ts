import prisma from '../config/db';
import { TaskStatus } from '@prisma/client';

export const getDashboardStats = async (userId: string) => {
  const [totalProjects, totalTasks, overdueTasks, completedThisWeek] = await Promise.all([
    prisma.project.count({ where: { members: { some: { userId } } } }),
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.count({ 
      where: { 
        assigneeId: userId, 
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE }
      } 
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: TaskStatus.DONE,
        completedAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      }
    })
  ]);

  const tasksByStatus = await prisma.task.groupBy({
    by: ['status'],
    where: { assigneeId: userId },
    _count: { _all: true }
  });

  return { totalProjects, totalTasks, overdueTasks, completedThisWeek, tasksByStatus };
};

export const getProjectAnalytics = async (projectId: string) => {
  const [tasksByStatus, tasksByPriority, totalTasks, completedTasks, overdueTasks, tasksByAssignee] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { projectId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where: { projectId }, _count: { _all: true } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: TaskStatus.DONE } }),
    prisma.task.count({ where: { projectId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } } }),
    prisma.task.groupBy({ by: ['assigneeId'], where: { projectId }, _count: { _all: true } })
  ]);

  const completionRate = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

  return { tasksByStatus, tasksByPriority, tasksByAssignee, totalTasks, completedTasks, completionRate, overdueTasks };
};

export const getRecentActivity = async (userId: string, limit = 10) => {
  const userProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true }
  });
  const projectIds = userProjects.map(p => p.projectId);

  return prisma.activityLog.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true, avatar: true } } }
  });
};
