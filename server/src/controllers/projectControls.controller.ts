import { Request, Response, NextFunction } from 'express';
import * as controlsService from '../services/projectControls.service';

// --- RISKS ---
export const getRisks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const risks = await controlsService.getProjectRisks(req.params.projectId);
    res.json(risks);
  } catch (err) {
    next(err);
  }
};

export const createRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const risk = await controlsService.createRisk(req.params.projectId, req.body);
    res.status(201).json(risk);
  } catch (err) {
    next(err);
  }
};

export const updateRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const risk = await controlsService.updateRisk(req.params.riskId, req.body);
    res.json(risk);
  } catch (err) {
    next(err);
  }
};

export const deleteRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await controlsService.deleteRisk(req.params.riskId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// --- ISSUES ---
export const getIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await controlsService.getProjectIssues(req.params.projectId);
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await controlsService.createIssue(req.params.projectId, req.body);
    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
};

export const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await controlsService.updateIssue(req.params.issueId, req.body);
    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await controlsService.deleteIssue(req.params.issueId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// --- DECISIONS ---
export const getDecisions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decisions = await controlsService.getProjectDecisions(req.params.projectId);
    res.json(decisions);
  } catch (err) {
    next(err);
  }
};

export const createDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await controlsService.createDecision(req.params.projectId, req.body, req.user!.id);
    res.status(201).json(decision);
  } catch (err) {
    next(err);
  }
};

export const updateDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await controlsService.updateDecision(req.params.decisionId, req.body);
    res.json(decision);
  } catch (err) {
    next(err);
  }
};

export const deleteDecision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await controlsService.deleteDecision(req.params.decisionId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// --- BASELINES ---
export const getBaselines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baselines = await controlsService.getProjectBaselines(req.params.projectId);
    res.json(baselines);
  } catch (err) {
    next(err);
  }
};

export const freezeBaseline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const baseline = await controlsService.freezeProjectBaseline(req.params.projectId, name, description, req.user!.id);
    res.status(201).json(baseline);
  } catch (err) {
    next(err);
  }
};

export const deleteBaseline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await controlsService.deleteProjectBaseline(req.params.baselineId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
