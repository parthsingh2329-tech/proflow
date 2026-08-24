import { Request, Response, NextFunction } from 'express';
import * as resourceService from '../services/resource.service';

export const getResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resources = await resourceService.getProjectResources(req.params.projectId);
    res.json(resources);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await resourceService.updateResourceProfile(
      req.params.projectId,
      req.params.userId,
      req.body
    );
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const getEquipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await resourceService.getEquipment(req.params.projectId);
    res.json(equipment);
  } catch (err) {
    next(err);
  }
};

export const createEquipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await resourceService.createEquipment(req.params.projectId, req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

export const updateEquipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await resourceService.updateEquipment(req.params.equipmentId, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const deleteEquipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await resourceService.deleteEquipment(req.params.equipmentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
