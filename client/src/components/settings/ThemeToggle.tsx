import { Sun, Moon } from 'lucide-react';
import useUiStore from '@/stores/uiStore';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useUiStore();

  const toggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
