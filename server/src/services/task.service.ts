import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { TaskStatus } from '@prisma/client';

export const createTask = async (data: any, reporterId: string) => {
  let { columnId, projectId, ...rest } = data;

  if (columnId && !projectId) {
    const col = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (col) {
      projectId = col.board.projectId;
    }
  }

  if (!columnId && projectId) {
    const defaultBoard = await prisma.board.findFirst({
      where: { projectId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (defaultBoard && defaultBoard.columns.length > 0) {
      columnId = defaultBoard.columns[0].id;
    }
  }

  const lastTask = columnId
    ? await prisma.task.findFirst({
        where: { columnId },
        orderBy: { order: 'desc' },
      })
    : null;
  const order = lastTask ? lastTask.order + 1 : 0;

  return prisma.task.create({
    data: {
      ...rest,
      projectId,
      columnId,
      reporterId,
      order,
    },
  });
};

export const getTasksByProject = async (projectId: string, filters: any) => {
  const { status, priority, assigneeId, labelId, milestoneId, search, page = 1, limit = 20, sortBy, sortOrder = 'asc' } = filters;
  const skip = (Number(page) - 1) * Number(limit);
  
  const where: any = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (milestoneId) where.milestoneId = milestoneId;
  if (labelId) where.labels = { some: { labelId } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = sortBy ? { [sortBy]: sortOrder as 'asc' | 'desc' } : { order: 'asc' as const };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        column: true,
        milestone: true,
        wbsNode: { select: { id: true, wbsCode: true, name: true, progress: true } },
        dependenciesAsSuccessor: { include: { predecessor: { select: { id: true, title: true, status: true, startDate: true, dueDate: true } } } },
        dependenciesAsPredecessor: { include: { successor: { select: { id: true, title: true, status: true, startDate: true, dueDate: true } } } },
        _count: { select: { subtasks: true } }
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const getTaskById = async (taskId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      reporter: { select: { id: true, name: true, avatar: true } },
      labels: { include: { label: true } },
      comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
      attachments: { include: { uploadedBy: { select: { id: true, name: true, avatar: true } } } },
      subtasks: true,
      timeEntries: true,
      milestone: true,
      column: true,
      wbsNode: { select: { id: true, wbsCode: true, name: true, progress: true } },
      dependenciesAsSuccessor: { include: { predecessor: { select: { id: true, title: true, status: true, startDate: true, dueDate: true } } } },
      dependenciesAsPredecessor: { include: { successor: { select: { id: true, title: true, status: true, startDate: true, dueDate: true } } } },
    },
  });
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

export const updateTask = async (taskId: string, data: any) => {
  if (data.status === TaskStatus.DONE) {
    data.completedAt = new Date();
  } else if (data.status && data.status !== TaskStatus.DONE) {
    data.completedAt = null;
  }
  return prisma.task.update({
    where: { id: taskId },
    data,
  });
};

export const deleteTask = async (taskId: string) => {
  return prisma.task.delete({ where: { id: taskId } });
};

export const moveTask = async (taskId: string, columnId: string, order: number) => {
  return prisma.$transaction(async (tx) => {
    const currentTask = await tx.task.findUnique({ where: { id: taskId } });
    if (!currentTask) throw new AppError('Task not found', 404);
    
    // Shift tasks in the new column down
    await tx.task.updateMany({
      where: { columnId, order: { gte: order }, id: { not: taskId } },
      data: { order: { increment: 1 } },
    });

    return tx.task.update({
      where: { id: taskId },
      data: { columnId, order },
    });
  });
};

export const getSubtasks = async (taskId: string) => {
  return prisma.task.findMany({ where: { parentTaskId: taskId } });
};

export const addLabel = async (taskId: string, labelId: string) => {
  return prisma.taskLabel.create({
    data: { taskId, labelId },
  });
};

export const removeLabel = async (taskId: string, labelId: string) => {
  return prisma.taskLabel.delete({
    where: { taskId_labelId: { taskId, labelId } },
  });
};

export const addDependency = async (data: { successorId: string; predecessorId: string; type?: 'FS'|'SS'|'FF'|'SF'; lagDays?: number }) => {
  const { successorId, predecessorId, type = 'FS', lagDays = 0 } = data;
  if (successorId === predecessorId) {
    throw new AppError('A task cannot depend on itself', 400);
  }
  return prisma.taskDependency.upsert({
    where: {
      predecessorId_successorId: { predecessorId, successorId },
    },
    update: { type, lagDays },
    create: { successorId, predecessorId, type, lagDays },
    include: {
      predecessor: { select: { id: true, title: true, status: true } },
      successor: { select: { id: true, title: true, status: true } },
    },
  });
};

export const removeDependency = async (dependencyId: string) => {
  return prisma.taskDependency.delete({
    where: { id: dependencyId },
  });
};
