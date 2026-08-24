import { Request, Response, NextFunction } from 'express';
import * as searchService from '../services/search.service';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    const results = await searchService.globalSearch(req.user!.id, query);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
