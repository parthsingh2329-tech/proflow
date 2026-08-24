import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, value, onValueChange, children, className }: { 
  defaultValue?: string; 
  value?: string; 
  onValueChange?: (val: string) => void; 
  children: React.ReactNode; 
  className?: string; 
}) {
  const [selected, setSelected] = React.useState(defaultValue || '');
  const activeTab = value !== undefined ? value : selected;
  const setActiveTab = onValueChange || setSelected;

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50 font-semibold'
          : 'hover:text-slate-900 dark:hover:text-slate-100',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div className={cn('mt-4 focus-visible:outline-none', className)}>
      {children}
    </div>
  );
}
