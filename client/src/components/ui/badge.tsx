import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    secondary: 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    destructive: 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    outline: 'text-slate-950 border border-slate-200 dark:border-slate-800 dark:text-slate-50',
    success: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
