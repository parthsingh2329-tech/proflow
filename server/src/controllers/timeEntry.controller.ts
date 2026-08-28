import { Request, Response, NextFunction } from 'express';
import * as timeEntryService from '../services/timeEntry.service';

export const getTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await timeEntryService.getTimeEntries(req.params.taskId);
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

export const createTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await timeEntryService.createTimeEntry(req.params.taskId, req.user!.id, req.body);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

export const updateTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await timeEntryService.updateTimeEntry(req.params.entryId, req.body);
    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

export const deleteTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await timeEntryService.deleteTimeEntry(req.params.entryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getProjectTimeReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await timeEntryService.getProjectTimeReport(req.params.projectId);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const getProjectTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await timeEntryService.getProjectTimeEntries(req.params.projectId);
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};
