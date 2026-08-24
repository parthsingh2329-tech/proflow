import { Request, Response, NextFunction } from 'express';
import * as attachmentService from '../services/attachment.service';
import { AppError } from '../middleware/errorHandler';

export const getAttachments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attachments = await attachmentService.getAttachments(req.params.taskId);
    res.status(200).json(attachments);
  } catch (error) {
    next(error);
  }
};

export const createAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file provided', 400);
    const attachment = await attachmentService.createAttachment(req.params.taskId, req.user!.id, req.file);
    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await attachmentService.deleteAttachment(req.params.attachmentId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
