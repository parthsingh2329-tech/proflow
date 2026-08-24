import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';
import * as activityService from '../services/activity.service';

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.body, req.user!.id);
    await activityService.logActivity({
      projectId: project.id,
      userId: req.user!.id,
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      newValues: req.body
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await projectService.getUserProjects(req.user!.id);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.body);
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(req.params.projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await projectService.addMember(req.params.projectId, req.body.email, req.body.role);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await projectService.updateMemberRole(req.params.projectId, req.params.memberId, req.body.role);
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.removeMember(req.params.projectId, req.params.memberId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await projectService.getProjectMembers(req.params.projectId);
    res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};
