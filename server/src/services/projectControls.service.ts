import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { RiskCategory, RiskStatus, IssueSeverity, IssueStatus, DecisionStatus } from '@prisma/client';

// ==========================================
// 1. RISK REGISTER SERVICE
// ==========================================

export const getProjectRisks = async (projectId: string) => {
  return prisma.risk.findMany({
    where: { projectId },
    orderBy: { score: 'desc' },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const createRisk = async (projectId: string, data: any) => {
  const count = await prisma.risk.count({ where: { projectId } });
  const riskCode = data.riskCode || `RSK-${String(count + 1).padStart(3, '0')}`;
  const probability = Number(data.probability) || 3;
  const impact = Number(data.impact) || 3;
  const score = probability * impact;

  return prisma.risk.create({
    data: {
      ...data,
      projectId,
      riskCode,
      probability,
      impact,
      score,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const updateRisk = async (riskId: string, data: any) => {
  const current = await prisma.risk.findUnique({ where: { id: riskId } });
  if (!current) throw new AppError('Risk not found', 404);

  const probability = data.probability !== undefined ? Number(data.probability) : current.probability;
  const impact = data.impact !== undefined ? Number(data.impact) : current.impact;
  const score = probability * impact;

  return prisma.risk.update({
    where: { id: riskId },
    data: {
      ...data,
      probability,
      impact,
      score,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const deleteRisk = async (riskId: string) => {
  return prisma.risk.delete({ where: { id: riskId } });
};

// ==========================================
// 2. ISSUE REGISTER SERVICE
// ==========================================

export const getProjectIssues = async (projectId: string) => {
  return prisma.issue.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const createIssue = async (projectId: string, data: any) => {
  const count = await prisma.issue.count({ where: { projectId } });
  const issueCode = data.issueCode || `ISS-${String(count + 1).padStart(3, '0')}`;

  return prisma.issue.create({
    data: {
      ...data,
      projectId,
      issueCode,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const updateIssue = async (issueId: string, data: any) => {
  return prisma.issue.update({
    where: { id: issueId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const deleteIssue = async (issueId: string) => {
  return prisma.issue.delete({ where: { id: issueId } });
};

// ==========================================
// 3. DECISION LOG SERVICE
// ==========================================

export const getProjectDecisions = async (projectId: string) => {
  return prisma.decision.findMany({
    where: { projectId },
    orderBy: { decisionDate: 'desc' },
    include: {
      approvedBy: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const createDecision = async (projectId: string, data: any, userId: string) => {
  const count = await prisma.decision.count({ where: { projectId } });
  const decisionCode = data.decisionCode || `DEC-${String(count + 1).padStart(3, '0')}`;

  return prisma.decision.create({
    data: {
      ...data,
      projectId,
      decisionCode,
      approvedById: data.approvedById || userId,
      decisionDate: data.decisionDate ? new Date(data.decisionDate) : new Date(),
    },
    include: {
      approvedBy: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const updateDecision = async (decisionId: string, data: any) => {
  return prisma.decision.update({
    where: { id: decisionId },
    data: {
      ...data,
      decisionDate: data.decisionDate ? new Date(data.decisionDate) : undefined,
    },
    include: {
      approvedBy: { select: { id: true, name: true, avatar: true, email: true } },
    },
  });
};

export const deleteDecision = async (decisionId: string) => {
  return prisma.decision.delete({ where: { id: decisionId } });
};

// ==========================================
// 4. BASELINE MANAGEMENT SERVICE
// ==========================================

export const getProjectBaselines = async (projectId: string) => {
  return prisma.projectBaseline.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      tasks: {
        include: {
          task: { select: { id: true, title: true, status: true, startDate: true, dueDate: true } },
        },
      },
    },
  });
};

export const freezeProjectBaseline = async (projectId: string, name: string, description: string | undefined, userId: string) => {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch current tasks for the project
    const currentTasks = await tx.task.findMany({
      where: { projectId },
    });

    // 2. Create the baseline record
    const baseline = await tx.projectBaseline.create({
      data: {
        projectId,
        name: name || `Baseline T${Date.now().toString().slice(-4)}`,
        description,
        createdById: userId,
      },
    });

    // 3. Snapshot all task start/due dates and estimates
    if (currentTasks.length > 0) {
      await tx.taskBaseline.createMany({
        data: currentTasks.map((t) => ({
          baselineId: baseline.id,
          taskId: t.id,
          startDate: t.startDate,
          dueDate: t.dueDate,
          estimatedHours: t.estimatedHours,
        })),
      });
    }

    return tx.projectBaseline.findUnique({
      where: { id: baseline.id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        tasks: true,
      },
    });
  });
};

export const deleteProjectBaseline = async (baselineId: string) => {
  return prisma.projectBaseline.delete({ where: { id: baselineId } });
};
