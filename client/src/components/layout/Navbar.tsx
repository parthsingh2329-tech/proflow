import { Search, LogOut, Menu, UserCircle, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import useUiStore from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from '@/components/settings/ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { toggleSidebar, toggleCommandPalette } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/projects') return 'Projects';
    if (path === '/calendar') return 'Calendar';
    if (path === '/settings') return 'Settings';
    return 'Workspace';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9 text-slate-500 hover:text-slate-900">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleCommandPalette}
          className="hidden sm:flex items-center space-x-2 h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search or command...</span>
          <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm dark:bg-slate-800">
            ⌘K
          </kbd>
        </button>

        <NotificationBell />
        <ThemeToggle />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-indigo-600 text-white font-semibold cursor-pointer" onClick={() => navigate('/settings')}>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
              {user?.name || 'User'}
            </span>
            <span className="text-[10px] text-slate-400 leading-none mt-1">
              {user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
