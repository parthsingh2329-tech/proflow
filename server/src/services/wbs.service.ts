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
  let wbsCode = data.wbsCode;

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

  return prisma.wBSNode.create({
    data: {
      projectId,
      parentNodeId: data.parentNodeId || null,
      wbsCode,
      name: data.name,
      nodeType: data.nodeType || 'WORK_PACKAGE',
      order: Number(data.order) || 0,
      progress: Number(data.progress) || 0,
      plannedCost: Number(data.plannedCost) || 0,
      actualCost: Number(data.actualCost) || 0,
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
  return prisma.wBSNode.update({
    where: { id: nodeId },
    data: {
      name: data.name,
      wbsCode: data.wbsCode,
      nodeType: data.nodeType,
      order: data.order !== undefined ? Number(data.order) : undefined,
      progress: data.progress !== undefined ? Number(data.progress) : undefined,
      plannedCost: data.plannedCost !== undefined ? Number(data.plannedCost) : undefined,
      actualCost: data.actualCost !== undefined ? Number(data.actualCost) : undefined,
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
