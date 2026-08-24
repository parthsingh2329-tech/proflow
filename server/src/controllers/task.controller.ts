import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import * as activityService from '../services/activity.service';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.createTask(req.body, req.user!.id);
    await activityService.logActivity({
      projectId: task.projectId,
      taskId: task.id,
      userId: req.user!.id,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: task.id,
      newValues: req.body
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getTasksByProject(req.params.projectId, req.query);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    await activityService.logActivity({
      projectId: task.projectId,
      taskId: task.id,
      userId: req.user!.id,
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: task.id,
      newValues: req.body
    });
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    await taskService.deleteTask(req.params.taskId);
    await activityService.logActivity({
      projectId: task.projectId,
      taskId: task.id,
      userId: req.user!.id,
      action: 'DELETED',
      entityType: 'TASK',
      entityId: task.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { columnId, order } = req.body;
    const task = await taskService.moveTask(req.params.taskId, columnId, order);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const getSubtasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getSubtasks(req.params.taskId);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createSubtask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.createTask({
      ...req.body,
      parentTaskId: req.params.taskId,
    }, req.user!.id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const addLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskLabel = await taskService.addLabel(req.params.taskId, req.params.labelId);
    res.status(201).json(taskLabel);
  } catch (error) {
    next(error);
  }
};

export const removeLabel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taskService.removeLabel(req.params.taskId, req.params.labelId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addDependency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dependency = await taskService.addDependency({
      successorId: req.params.taskId,
      predecessorId: req.body.predecessorId,
      type: req.body.type,
      lagDays: req.body.lagDays,
    });
    res.status(201).json(dependency);
  } catch (error) {
    next(error);
  }
};

export const removeDependency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taskService.removeDependency(req.params.dependencyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
