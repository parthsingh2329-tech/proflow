import prisma from '../config/db';

export const globalSearch = async (userId: string, query: string) => {
  if (!query || query.trim() === '') return { tasks: [], projects: [], comments: [] };

  const userProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true }
  });
  const projectIds = userProjects.map(p => p.projectId);

  const [tasks, projects, comments] = await Promise.all([
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        id: { in: projectIds },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
    }),
    prisma.comment.findMany({
      where: {
        task: { projectId: { in: projectIds } },
        content: { contains: query, mode: 'insensitive' }
      },
      include: { task: { select: { id: true, title: true } } },
      take: 10,
    })
  ]);

  return { tasks, projects, comments };
};
