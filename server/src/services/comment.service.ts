import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const getComments = async (taskId: string) => {
  return prisma.comment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

export const createComment = async (taskId: string, userId: string, content: string) => {
  return prisma.comment.create({
    data: { taskId, userId, content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
};

export const updateComment = async (commentId: string, userId: string, content: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId !== userId) throw new AppError('Unauthorized to update this comment', 403);

  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.userId !== userId) throw new AppError('Unauthorized to delete this comment', 403);

  return prisma.comment.delete({ where: { id: commentId } });
};
