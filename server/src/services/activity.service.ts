import prisma from '../config/db';

export const logActivity = async (data: { 
  projectId: string, 
  taskId?: string, 
  userId: string, 
  action: string, 
  entityType: string, 
  entityId: string, 
  oldValues?: any, 
  newValues?: any 
}) => {
  return prisma.activityLog.create({
    data: {
      projectId: data.projectId,
      taskId: data.taskId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValues: data.oldValues ? data.oldValues : undefined,
      newValues: data.newValues ? data.newValues : undefined,
    }
  });
};

export const getProjectActivity = async (projectId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { projectId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    }),
    prisma.activityLog.count({ where: { projectId } })
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};
