import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const getBoards = async (projectId: string) => {
  return prisma.board.findMany({
    where: { projectId },
    include: { columns: { orderBy: { order: 'asc' } } },
  });
};

export const createBoard = async (projectId: string, data: any) => {
  return prisma.board.create({
    data: {
      ...data,
      projectId,
      columns: {
        create: [
          { name: 'To Do', order: 0 },
          { name: 'In Progress', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
  });
};

export const getColumns = async (boardId: string) => {
  return prisma.column.findMany({
    where: { boardId },
    orderBy: { order: 'asc' },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });
};

export const createColumn = async (boardId: string, data: any) => {
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
  });
  const order = lastColumn ? lastColumn.order + 1 : 0;

  return prisma.column.create({
    data: { ...data, boardId, order },
  });
};

export const updateColumn = async (columnId: string, data: any) => {
  return prisma.column.update({
    where: { id: columnId },
    data,
  });
};

export const deleteColumn = async (columnId: string) => {
  return prisma.$transaction(async (tx) => {
    const column = await tx.column.findUnique({ where: { id: columnId } });
    if (!column) throw new AppError('Column not found', 404);

    const firstColumn = await tx.column.findFirst({
      where: { boardId: column.boardId, id: { not: columnId } },
      orderBy: { order: 'asc' },
    });

    if (firstColumn) {
      await tx.task.updateMany({
        where: { columnId },
        data: { columnId: firstColumn.id },
      });
    } else {
      await tx.task.updateMany({
        where: { columnId },
        data: { columnId: null },
      });
    }

    await tx.column.delete({ where: { id: columnId } });
  });
};

export const reorderColumns = async (boardId: string, columnIds: string[]) => {
  return prisma.$transaction(
    columnIds.map((id, index) =>
      prisma.column.update({
        where: { id },
        data: { order: index },
      })
    )
  );
};
