import prisma from '../config/db';

export const getLabels = async (projectId: string) => {
  return prisma.label.findMany({ where: { projectId } });
};

export const createLabel = async (projectId: string, data: any) => {
  return prisma.label.create({ data: { ...data, projectId } });
};

export const updateLabel = async (labelId: string, data: any) => {
  return prisma.label.update({ where: { id: labelId }, data });
};

export const deleteLabel = async (labelId: string) => {
  return prisma.label.delete({ where: { id: labelId } });
};
