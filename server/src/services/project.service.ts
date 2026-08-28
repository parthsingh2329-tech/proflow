import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { ProjectRole } from '@prisma/client';

export const createProject = async (data: any, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        ...data,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: ProjectRole.ADMIN,
          },
        },
      },
    });

    const board = await tx.board.create({
      data: {
        projectId: project.id,
        name: 'Default Board',
        type: 'KANBAN',
        columns: {
          create: [
            { name: 'To Do', order: 0 },
            { name: 'In Progress', order: 1 },
            { name: 'In Review', order: 2 },
            { name: 'Done', order: 3 },
          ],
        },
      },
    });

    return project;
  });
};

export const getUserProjects = async (userId: string) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, tasks: true } },
    },
  });
  return projects;
};

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      boards: { include: { columns: { orderBy: { order: 'asc' } } } },
      labels: true,
    },
  });
  if (!project) throw new AppError('Project not found', 404);
  return project;
};

export const updateProject = async (projectId: string, data: any) => {
  return prisma.project.update({
    where: { id: projectId },
    data,
  });
};

export const deleteProject = async (projectId: string) => {
  await prisma.project.delete({ where: { id: projectId } });
};

export const addMember = async (projectId: string, email: string, role: ProjectRole) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  const existingMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existingMember) throw new AppError('User is already a member', 400);

  return prisma.projectMember.create({
    data: { projectId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
};

export const updateMemberRole = async (projectId: string, memberId: string, role: ProjectRole) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      OR: [{ id: memberId }, { userId: memberId }],
    },
  });
  if (!member) throw new AppError('Project member not found', 404);

  return prisma.projectMember.update({
    where: { id: member.id },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
};

export const removeMember = async (projectId: string, memberId: string) => {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      OR: [{ id: memberId }, { userId: memberId }],
    },
  });
  if (!member) throw new AppError('Project member not found', 404);

  return prisma.projectMember.delete({ where: { id: member.id } });
};

export const getProjectMembers = async (projectId: string) => {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
};
