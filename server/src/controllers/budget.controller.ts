import { Request, Response, NextFunction } from 'express';
import * as budgetService from '../services/budget.service';

export const getBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.getProjectBudget(req.params.projectId);
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

export const updateBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.updateProjectBudget(req.params.projectId, req.body);
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

export const addCostItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const costItem = await budgetService.addCostItem(req.params.projectId, req.body);
    res.status(201).json(costItem);
  } catch (err) {
    next(err);
  }
};

export const updateCostItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const costItem = await budgetService.updateCostItem(req.params.costItemId, req.body);
    res.json(costItem);
  } catch (err) {
    next(err);
  }
};

export const deleteCostItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await budgetService.deleteCostItem(req.params.costItemId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
