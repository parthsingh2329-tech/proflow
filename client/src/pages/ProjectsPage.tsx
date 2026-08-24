import { useState } from 'react';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import ProjectCard from '@/components/projects/ProjectCard';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projects
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your workspaces, track tasks, and collaborate with teams.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="space-x-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No projects found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {search ? 'Try adjusting your search query' : 'Get started by creating your first project.'}
          </p>
          {!search && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4 space-x-2 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
