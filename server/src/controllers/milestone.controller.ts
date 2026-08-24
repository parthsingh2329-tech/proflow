import { Request, Response, NextFunction } from 'express';
import * as milestoneService from '../services/milestone.service';

export const getMilestones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestones = await milestoneService.getMilestones(req.params.projectId);
    res.status(200).json(milestones);
  } catch (error) {
    next(error);
  }
};

export const createMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestone = await milestoneService.createMilestone(req.params.projectId, req.body);
    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestone = await milestoneService.updateMilestone(req.params.milestoneId, req.body);
    res.status(200).json(milestone);
  } catch (error) {
    next(error);
  }
};

export const deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await milestoneService.deleteMilestone(req.params.milestoneId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
