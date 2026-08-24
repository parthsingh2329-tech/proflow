import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { ECOStatus } from '@prisma/client';

export const getChangeRequests = async (projectId: string) => {
  return prisma.changeRequest.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      requestedBy: { select: { id: true, name: true, avatar: true } },
      approvedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const createChangeRequest = async (projectId: string, userId: string, data: any) => {
  let ecoCode = data.ecoCode;
  if (!ecoCode) {
    const count = await prisma.changeRequest.count({ where: { projectId } });
    ecoCode = `ECO-${String(100 + count + 1).padStart(4, '0')}`;
  }

  return prisma.changeRequest.create({
    data: {
      projectId,
      ecoCode,
      title: data.title,
      description: data.description,
      reason: data.reason,
      costImpact: Number(data.costImpact) || 0,
      scheduleImpactDays: Number(data.scheduleImpactDays) || 0,
      riskImpact: data.riskImpact,
      status: 'SUBMITTED',
      requestedById: userId,
    },
    include: {
      requestedBy: { select: { id: true, name: true, avatar: true } },
      approvedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const updateChangeRequest = async (ecoId: string, data: any) => {
  return prisma.changeRequest.update({
    where: { id: ecoId },
    data: {
      title: data.title,
      description: data.description,
      reason: data.reason,
      costImpact: data.costImpact !== undefined ? Number(data.costImpact) : undefined,
      scheduleImpactDays: data.scheduleImpactDays !== undefined ? Number(data.scheduleImpactDays) : undefined,
      riskImpact: data.riskImpact,
      status: data.status,
    },
    include: {
      requestedBy: { select: { id: true, name: true, avatar: true } },
      approvedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const reviewChangeRequest = async (ecoId: string, approverId: string, status: ECOStatus) => {
  return prisma.changeRequest.update({
    where: { id: ecoId },
    data: {
      status,
      approvedById: approverId,
      approvedAt: new Date(),
    },
    include: {
      requestedBy: { select: { id: true, name: true, avatar: true } },
      approvedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const deleteChangeRequest = async (ecoId: string) => {
  return prisma.changeRequest.delete({ where: { id: ecoId } });
};
