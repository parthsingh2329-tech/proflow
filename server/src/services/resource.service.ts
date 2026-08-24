import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const getProjectResources = async (projectId: string) => {
  // 1. Fetch project members with user details
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // 2. Fetch resource profiles for this project
  const profiles = await prisma.resourceProfile.findMany({
    where: { projectId },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  // 3. Fetch active tasks for allocated hours
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { not: 'DONE' },
    },
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      estimatedHours: true,
      assigneeId: true,
      dueDate: true,
    },
  });

  // 4. Compute allocation per member
  const resourceList = members.map((m) => {
    const profile = profileMap.get(m.userId);
    const assignedTasks = tasks.filter((t) => t.assigneeId === m.userId);
    const allocatedHours = assignedTasks.reduce((acc, t) => acc + (t.estimatedHours || 8), 0);
    const weeklyCapacityHours = profile?.weeklyCapacityHours || 40.0;
    const hourlyRate = profile?.hourlyRate || 2500.0;
    const utilizationPercent = Math.round((allocatedHours / weeklyCapacityHours) * 100);

    let overloadStatus: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE' = 'AVAILABLE';
    if (utilizationPercent > 100) {
      overloadStatus = 'OVERLOADED'; // 🔴
    } else if (utilizationPercent >= 85) {
      overloadStatus = 'BALANCED'; // 🟡
    } else {
      overloadStatus = 'AVAILABLE'; // 🟢
    }

    return {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      jobTitle: profile?.jobTitle || (m.role === 'ADMIN' ? 'Chief Architect' : 'Senior Engineer'),
      department: profile?.department || 'R&D Engineering',
      weeklyCapacityHours,
      hourlyRate,
      skills: profile?.skills || 'Engineering, Systems Architecture',
      allocatedHours,
      utilizationPercent,
      overloadStatus,
      assignedTasksCount: assignedTasks.length,
      assignedTasks,
    };
  });

  return resourceList;
};

export const updateResourceProfile = async (projectId: string, userId: string, data: any) => {
  return prisma.resourceProfile.upsert({
    where: {
      userId_projectId: { userId, projectId },
    },
    update: {
      jobTitle: data.jobTitle,
      department: data.department,
      weeklyCapacityHours: data.weeklyCapacityHours !== undefined ? Number(data.weeklyCapacityHours) : undefined,
      hourlyRate: data.hourlyRate !== undefined ? Number(data.hourlyRate) : undefined,
      skills: data.skills,
    },
    create: {
      userId,
      projectId,
      jobTitle: data.jobTitle,
      department: data.department,
      weeklyCapacityHours: Number(data.weeklyCapacityHours) || 40.0,
      hourlyRate: Number(data.hourlyRate) || 2500.0,
      skills: data.skills,
    },
  });
};

// ==========================================
// EQUIPMENT & TEST RIGS
// ==========================================

export const getEquipment = async (projectId: string) => {
  return prisma.equipmentResource.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      assignedTask: { select: { id: true, title: true } },
    },
  });
};

export const createEquipment = async (projectId: string, data: any) => {
  return prisma.equipmentResource.create({
    data: {
      projectId,
      name: data.name,
      category: data.category || 'Test Bench',
      location: data.location,
      status: data.status || 'AVAILABLE',
      costPerHour: Number(data.costPerHour) || 0,
      assignedTaskId: data.assignedTaskId || null,
    },
  });
};

export const updateEquipment = async (equipmentId: string, data: any) => {
  return prisma.equipmentResource.update({
    where: { id: equipmentId },
    data: {
      name: data.name,
      category: data.category,
      location: data.location,
      status: data.status,
      costPerHour: data.costPerHour !== undefined ? Number(data.costPerHour) : undefined,
      assignedTaskId: data.assignedTaskId,
    },
  });
};

export const deleteEquipment = async (equipmentId: string) => {
  return prisma.equipmentResource.delete({ where: { id: equipmentId } });
};
