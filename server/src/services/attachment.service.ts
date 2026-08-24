import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs/promises';
import path from 'path';

export const getAttachments = async (taskId: string) => {
  return prisma.attachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const createAttachment = async (taskId: string, userId: string, file: Express.Multer.File) => {
  return prisma.attachment.create({
    data: {
      taskId,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedById: userId,
    }
  });
};

export const deleteAttachment = async (attachmentId: string, userId: string) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) throw new AppError('Attachment not found', 404);
  if (attachment.uploadedById !== userId) throw new AppError('Unauthorized', 403);

  // Delete file from disk
  const filePath = path.join(__dirname, '../../', attachment.fileUrl);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
  }

  return prisma.attachment.delete({ where: { id: attachmentId } });
};
