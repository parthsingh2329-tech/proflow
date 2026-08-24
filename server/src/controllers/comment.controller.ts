import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await commentService.getComments(req.params.taskId);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentService.createComment(req.params.taskId, req.user!.id, req.body.content);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentService.updateComment(req.params.commentId, req.user!.id, req.body.content);
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await commentService.deleteComment(req.params.commentId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
