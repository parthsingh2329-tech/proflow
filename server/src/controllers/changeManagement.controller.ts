import { Request, Response, NextFunction } from 'express';
import * as changeService from '../services/changeManagement.service';

export const getChanges = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const changes = await changeService.getChangeRequests(req.params.projectId);
    res.json(changes);
  } catch (err) {
    next(err);
  }
};

export const createChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const change = await changeService.createChangeRequest(
      req.params.projectId,
      (req as any).user.id,
      req.body
    );
    res.status(201).json(change);
  } catch (err) {
    next(err);
  }
};

export const updateChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const change = await changeService.updateChangeRequest(req.params.ecoId, req.body);
    res.json(change);
  } catch (err) {
    next(err);
  }
};

export const reviewChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const change = await changeService.reviewChangeRequest(
      req.params.ecoId,
      (req as any).user.id,
      req.body.status
    );
    res.json(change);
  } catch (err) {
    next(err);
  }
};

export const deleteChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await changeService.deleteChangeRequest(req.params.ecoId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
