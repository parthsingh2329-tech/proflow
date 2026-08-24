import { Request, Response, NextFunction } from 'express';
import * as governanceService from '../services/governance.service';

export const getGates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gates = await governanceService.getPhaseGates(req.params.projectId);
    res.json(gates);
  } catch (err) {
    next(err);
  }
};

export const createGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gate = await governanceService.createPhaseGate(req.params.projectId, req.body);
    res.status(201).json(gate);
  } catch (err) {
    next(err);
  }
};

export const updateGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gate = await governanceService.updatePhaseGate(req.params.gateId, req.body);
    res.json(gate);
  } catch (err) {
    next(err);
  }
};

export const toggleCriteria = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const criteria = await governanceService.toggleGateCriteria(
      req.params.criteriaId,
      req.body.isMet,
      req.body.evidenceNotes
    );
    res.json(criteria);
  } catch (err) {
    next(err);
  }
};

export const signOffGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gate = await governanceService.signOffGate(
      req.params.gateId,
      (req as any).user.id,
      req.body
    );
    res.json(gate);
  } catch (err) {
    next(err);
  }
};

export const deleteGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await governanceService.deletePhaseGate(req.params.gateId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
