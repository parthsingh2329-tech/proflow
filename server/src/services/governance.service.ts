import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { GateStatus } from '@prisma/client';

export const getPhaseGates = async (projectId: string) => {
  return prisma.phaseGate.findMany({
    where: { projectId },
    orderBy: { targetDate: 'asc' },
    include: {
      criteria: { orderBy: { createdAt: 'asc' } },
      signOffBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const createPhaseGate = async (projectId: string, data: any) => {
  return prisma.phaseGate.create({
    data: {
      projectId,
      gateCode: data.gateCode,
      name: data.name,
      targetDate: new Date(data.targetDate),
      status: data.status || 'UPCOMING',
      reviewSummary: data.reviewSummary,
      criteria: {
        create: (data.criteria || []).map((c: any) => ({
          description: c.description,
          isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
          isMet: c.isMet || false,
          evidenceNotes: c.evidenceNotes,
        })),
      },
    },
    include: {
      criteria: true,
      signOffBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const updatePhaseGate = async (gateId: string, data: any) => {
  return prisma.phaseGate.update({
    where: { id: gateId },
    data: {
      name: data.name,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      status: data.status,
      reviewSummary: data.reviewSummary,
    },
    include: {
      criteria: true,
      signOffBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const toggleGateCriteria = async (criteriaId: string, isMet: boolean, evidenceNotes?: string) => {
  return prisma.gateCriteria.update({
    where: { id: criteriaId },
    data: {
      isMet,
      evidenceNotes: evidenceNotes !== undefined ? evidenceNotes : undefined,
    },
  });
};

export const signOffGate = async (gateId: string, userId: string, data: { status: GateStatus; reviewSummary?: string }) => {
  return prisma.phaseGate.update({
    where: { id: gateId },
    data: {
      status: data.status,
      reviewSummary: data.reviewSummary,
      signOffById: userId,
      signOffDate: new Date(),
    },
    include: {
      criteria: true,
      signOffBy: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const deletePhaseGate = async (gateId: string) => {
  return prisma.phaseGate.delete({ where: { id: gateId } });
};
