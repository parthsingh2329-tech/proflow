import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandPalette from './CommandPalette';
import useUiStore from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export default function AppShell() {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'pl-0 md:pl-16' : 'pl-0 md:pl-64'
        )}
      >
        <Navbar />
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
