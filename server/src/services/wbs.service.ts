import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { WBSNodeType } from '@prisma/client';

export interface WBSNodeWithChildren {
  id: string;
  projectId: string;
  parentNodeId: string | null;
  wbsCode: string;
  name: string;
  nodeType: WBSNodeType;
  order: number;
  progress: number;
  plannedCost: number;
  actualCost: number;
  ownerId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  owner?: { id: string; name: string; avatar: string | null } | null;
  tasks?: any[];
  children: WBSNodeWithChildren[];
}

export const getWBSHierarchy = async (projectId: string): Promise<WBSNodeWithChildren[]> => {
  const nodes = await prisma.wBSNode.findMany({
    where: { projectId },
    orderBy: [{ order: 'asc' }, { wbsCode: 'asc' }],
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          startDate: true,
          isMilestone: true,
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  // Map to build tree
  const nodeMap = new Map<string, WBSNodeWithChildren>();
  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n, children: [] });
  });

  const roots: WBSNodeWithChildren[] = [];

  nodeMap.forEach((node) => {
    if (node.parentNodeId && nodeMap.has(node.parentNodeId)) {
      nodeMap.get(node.parentNodeId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Recursive rollup calculator
  const calculateRollups = (node: WBSNodeWithChildren) => {
    if (node.children.length > 0) {
      node.children.forEach(calculateRollups);
      
      const totalPlanned = node.children.reduce((acc, c) => acc + c.plannedCost, 0);
      const totalActual = node.children.reduce((acc, c) => acc + c.actualCost, 0);
      const avgProgress = node.children.reduce((acc, c) => acc + c.progress, 0) / node.children.length;

      node.plannedCost = totalPlanned > 0 ? totalPlanned : node.plannedCost;
      node.actualCost = totalActual > 0 ? totalActual : node.actualCost;
      node.progress = Math.round(avgProgress);
    }
  };

  roots.forEach(calculateRollups);
  return roots;
};

export const createWBSNode = async (projectId: string, data: any) => {
  let wbsCode = (data.wbsCode || '').trim();

  if (!wbsCode) {
    if (data.parentNodeId) {
      const parent = await prisma.wBSNode.findUnique({ where: { id: data.parentNodeId } });
      const siblingCount = await prisma.wBSNode.count({ where: { parentNodeId: data.parentNodeId } });
      wbsCode = parent ? `${parent.wbsCode}.${siblingCount + 1}` : `1.${siblingCount + 1}`;
    } else {
      const rootCount = await prisma.wBSNode.count({ where: { projectId, parentNodeId: null } });
      wbsCode = `${rootCount + 1}.0`;
    }
  }

  // Validate WBS Code Uniqueness within the project
  const existingCode = await prisma.wBSNode.findFirst({
    where: { projectId, wbsCode },
  });
  if (existingCode) {
    throw new AppError(
      `WBS code "${wbsCode}" is already assigned to "${existingCode.name}". Please specify a unique WBS code.`,
      400
    );
  }

  const progress = Math.min(100, Math.max(0, Number(data.progress) || 0));
  const plannedCost = Math.max(0, Number(data.plannedCost) || 0);
  const actualCost = Math.max(0, Number(data.actualCost) || 0);

  return prisma.wBSNode.create({
    data: {
      projectId,
      parentNodeId: data.parentNodeId || null,
      wbsCode,
      name: data.name,
      nodeType: data.nodeType || 'WORK_PACKAGE',
      order: Number(data.order) || 0,
      progress,
      plannedCost,
      actualCost,
      ownerId: data.ownerId || null,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const updateWBSNode = async (nodeId: string, data: any) => {
  const currentNode = await prisma.wBSNode.findUnique({ where: { id: nodeId } });
  if (!currentNode) throw new AppError('WBS node not found', 404);

  if (data.wbsCode && data.wbsCode.trim() !== currentNode.wbsCode) {
    const existing = await prisma.wBSNode.findFirst({
      where: { projectId: currentNode.projectId, wbsCode: data.wbsCode.trim(), id: { not: nodeId } },
    });
    if (existing) {
      throw new AppError(`WBS code "${data.wbsCode.trim()}" is already assigned to "${existing.name}".`, 400);
    }
  }

  const progress = data.progress !== undefined ? Math.min(100, Math.max(0, Number(data.progress))) : undefined;
  const plannedCost = data.plannedCost !== undefined ? Math.max(0, Number(data.plannedCost)) : undefined;
  const actualCost = data.actualCost !== undefined ? Math.max(0, Number(data.actualCost)) : undefined;

  return prisma.wBSNode.update({
    where: { id: nodeId },
    data: {
      name: data.name,
      wbsCode: data.wbsCode ? data.wbsCode.trim() : undefined,
      nodeType: data.nodeType,
      order: data.order !== undefined ? Number(data.order) : undefined,
      progress,
      plannedCost,
      actualCost,
      ownerId: data.ownerId,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
};

export const deleteWBSNode = async (nodeId: string) => {
  return prisma.wBSNode.delete({ where: { id: nodeId } });
};
