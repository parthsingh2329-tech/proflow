import { useNavigate } from 'react-router-dom';
import { Layers, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { format } from 'date-fns';

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group relative cursor-pointer overflow-hidden border-slate-200 transition-all hover:shadow-md hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-900"
    >
      {/* Top accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: project.color || '#6366f1' }}
      />
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {project.name}
          </CardTitle>
          <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>
        {project.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>{project.taskCount ?? 0} tasks</span>
          </div>

          {project.endDate && (
            <div className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
