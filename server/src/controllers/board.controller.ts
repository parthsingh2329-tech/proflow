import { Request, Response, NextFunction } from 'express';
import * as boardService from '../services/board.service';

export const getBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boards = await boardService.getBoards(req.params.projectId);
    res.status(200).json(boards);
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await boardService.createBoard(req.params.projectId, req.body);
    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

export const getColumns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const columns = await boardService.getColumns(req.params.boardId);
    res.status(200).json(columns);
  } catch (error) {
    next(error);
  }
};

export const createColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const column = await boardService.createColumn(req.params.boardId, req.body);
    res.status(201).json(column);
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const column = await boardService.updateColumn(req.params.columnId, req.body);
    res.status(200).json(column);
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await boardService.deleteColumn(req.params.columnId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const reorderColumns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await boardService.reorderColumns(req.params.boardId, req.body.columnIds);
    res.status(200).json({ message: 'Columns reordered' });
  } catch (error) {
    next(error);
  }
};
