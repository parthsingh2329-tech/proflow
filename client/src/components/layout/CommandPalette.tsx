import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, Plus, LayoutDashboard, Calendar } from 'lucide-react';
import useUiStore from '@/stores/uiStore';
import { useProjects } from '@/hooks/useProjects';
import { Dialog } from '@/components/ui/dialog';

export default function CommandPalette() {
  const { commandPaletteOpen, toggleCommandPalette } = useUiStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  const handleSelect = (action: () => void) => {
    action();
    toggleCommandPalette();
    setQuery('');
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={toggleCommandPalette}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-4 text-xs">
          {/* Quick Navigation */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider px-2">Navigation</span>
            <button
              onClick={() => handleSelect(() => navigate('/'))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => handleSelect(() => navigate('/projects'))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <FolderKanban className="h-4 w-4 text-blue-500" />
              <span>Go to Projects</span>
            </button>
            <button
              onClick={() => handleSelect(() => navigate('/calendar'))}
              className="flex w-full items-center space-x-2.5 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span>Go to Calendar</span>
            </button>
          </div>

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider px-2">Projects</span>
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(() => navigate(`/projects/${p.id}`))}
                  className="flex w-full items-center space-x-2.5 rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
