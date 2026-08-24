import { Request, Response, NextFunction } from 'express';
import * as wbsService from '../services/wbs.service';

export const getWBS = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wbs = await wbsService.getWBSHierarchy(req.params.projectId);
    res.json(wbs);
  } catch (err) {
    next(err);
  }
};

export const createWBSNode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = await wbsService.createWBSNode(req.params.projectId, req.body);
    res.status(201).json(node);
  } catch (err) {
    next(err);
  }
};

export const updateWBSNode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const node = await wbsService.updateWBSNode(req.params.nodeId, req.body);
    res.json(node);
  } catch (err) {
    next(err);
  }
};

export const deleteWBSNode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await wbsService.deleteWBSNode(req.params.nodeId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
