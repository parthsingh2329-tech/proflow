import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { CostCategory, CostStatus } from '@prisma/client';
import { getWBSHierarchy } from './wbs.service';

export const getProjectBudget = async (projectId: string) => {
  let budget = await prisma.projectBudget.findUnique({
    where: { projectId },
    include: {
      costItems: {
        orderBy: { createdAt: 'desc' },
      },
      evmSnapshots: {
        orderBy: { periodDate: 'asc' },
      },
    },
  });

  // If no budget exists, auto-initialize a default project budget
  if (!budget) {
    budget = await prisma.projectBudget.create({
      data: {
        projectId,
        currency: 'INR',
        approvedBudget: 10000000, // Default ₹1 Cr
        contingencyReserve: 1000000,
      },
      include: {
        costItems: true,
        evmSnapshots: true,
      },
    });
  }

  // Fetch all tasks for backup task count metric
  const tasks = await prisma.task.findMany({
    where: { projectId },
  });

  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  
  // Reconciled single-source-of-truth: calculate scope completion directly from WBS hierarchy rollups
  const wbsRoots = await getWBSHierarchy(projectId);
  let wbsPercentComplete = 0;
  if (wbsRoots.length > 0) {
    const totalWBSProgress = wbsRoots.reduce((acc, root) => acc + (root.progress || 0), 0);
    wbsPercentComplete = totalWBSProgress / (wbsRoots.length * 100);
  } else {
    wbsPercentComplete = ((completedTasks * 1.0) + (inProgressTasks * 0.5)) / totalTasks;
  }

  const projectPercentComplete = Number(wbsPercentComplete.toFixed(4));

  const totalPlannedCost = budget.costItems.reduce((acc, item) => acc + item.plannedAmount, 0);
  const totalCommittedCost = budget.costItems.reduce((acc, item) => acc + item.committedAmount, 0);
  const totalActualCost = budget.costItems.reduce((acc, item) => acc + item.actualAmount, 0);

  const BAC = budget.approvedBudget || totalPlannedCost || 1;
  const EV = Number((BAC * projectPercentComplete).toFixed(2));
  const AC = totalActualCost > 0 ? totalActualCost : 1;
  
  // Planned Value (PV) up to now: assuming 60% of timeline elapsed if tasks are scheduled
  const PV = Math.max(BAC * 0.55, 1);

  const CPI = Number((EV / AC).toFixed(2));
  const SPI = Number((EV / PV).toFixed(2));
  const EAC = CPI > 0 ? Number((BAC / CPI).toFixed(2)) : BAC;
  const ETC = Math.max(0, Number((EAC - AC).toFixed(2)));
  const VAC = Number((BAC - EAC).toFixed(2));
  const CV = Number((EV - AC).toFixed(2));
  const SV = Number((EV - PV).toFixed(2));

  return {
    ...budget,
    analytics: {
      totalPlannedCost,
      totalCommittedCost,
      totalActualCost,
      remainingBudget: budget.approvedBudget - totalActualCost,
      projectPercentComplete: Math.round(projectPercentComplete * 100),
      BAC,
      PV,
      EV,
      AC,
      CPI,
      SPI,
      EAC,
      ETC,
      VAC,
      CV,
      SV,
    },
  };
};

export const updateProjectBudget = async (projectId: string, data: any) => {
  return prisma.projectBudget.upsert({
    where: { projectId },
    update: {
      currency: data.currency,
      approvedBudget: data.approvedBudget !== undefined ? Number(data.approvedBudget) : undefined,
      contingencyReserve: data.contingencyReserve !== undefined ? Number(data.contingencyReserve) : undefined,
      notes: data.notes,
    },
    create: {
      projectId,
      currency: data.currency || 'INR',
      approvedBudget: Number(data.approvedBudget) || 0,
      contingencyReserve: Number(data.contingencyReserve) || 0,
      notes: data.notes,
    },
  });
};

export const addCostItem = async (projectId: string, data: any) => {
  const budget = await prisma.projectBudget.findUnique({ where: { projectId } });
  if (!budget) throw new AppError('Project budget not found', 404);

  return prisma.budgetCostItem.create({
    data: {
      budgetId: budget.id,
      name: data.name,
      category: data.category || 'PROTOTYPE_BOM',
      plannedAmount: Number(data.plannedAmount) || 0,
      committedAmount: Number(data.committedAmount) || 0,
      actualAmount: Number(data.actualAmount) || 0,
      vendor: data.vendor,
      purchaseOrderNo: data.purchaseOrderNo,
      invoiceNo: data.invoiceNo,
      status: data.status || 'PLANNED',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });
};

export const updateCostItem = async (costItemId: string, data: any) => {
  return prisma.budgetCostItem.update({
    where: { id: costItemId },
    data: {
      name: data.name,
      category: data.category,
      plannedAmount: data.plannedAmount !== undefined ? Number(data.plannedAmount) : undefined,
      committedAmount: data.committedAmount !== undefined ? Number(data.committedAmount) : undefined,
      actualAmount: data.actualAmount !== undefined ? Number(data.actualAmount) : undefined,
      vendor: data.vendor,
      purchaseOrderNo: data.purchaseOrderNo,
      invoiceNo: data.invoiceNo,
      status: data.status,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
  });
};

export const deleteCostItem = async (costItemId: string) => {
  return prisma.budgetCostItem.delete({ where: { id: costItemId } });
};
