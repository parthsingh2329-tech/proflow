import { Request, Response, NextFunction } from 'express';
import * as labelService from '../services/label.service';

export const getLabels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labels = await labelService.getLabels(req.params.projectId);
    res.status(200).json(labels);
  } catch (error) {
    next(error);
  }
};

export const createLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const label = await labelService.createLabel(req.params.projectId, req.body);
    res.status(201).json(label);
  } catch (error) {
    next(error);
  }
};

export const updateLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const label = await labelService.updateLabel(req.params.labelId, req.body);
    res.status(200).json(label);
  } catch (error) {
    next(error);
  }
};

export const deleteLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await labelService.deleteLabel(req.params.labelId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
