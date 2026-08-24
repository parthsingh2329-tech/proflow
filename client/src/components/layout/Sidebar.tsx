import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  Plus, 
  Layers, 
  CheckSquare, 
  ChevronRight 
} from 'lucide-react';
import useUiStore from '@/stores/uiStore';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const { sidebarCollapsed } = useUiStore();
  const { data: projects = [] } = useProjects();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold">
              <CheckSquare className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  ProFlow
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  Project Workspace
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Projects Quick List */}
          {!sidebarCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  My Projects
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreateProjectOpen(true)}
                  className="h-6 w-6 text-slate-400 hover:text-slate-900"
                  title="New project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <p className="px-3 text-xs text-slate-400 py-2">No projects yet</p>
                ) : (
                  projects.slice(0, 8).map((proj) => (
                    <NavLink
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center space-x-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50'
                        )
                      }
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      />
                      <span className="truncate flex-1">{proj.name}</span>
                    </NavLink>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Action */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              className="w-full justify-center space-x-2 text-xs font-semibold"
              onClick={() => setCreateProjectOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </div>
        )}
      </aside>

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
    </>
  );
}
