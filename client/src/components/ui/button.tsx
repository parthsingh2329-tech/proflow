import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';
    
    const variants = {
      default: 'bg-indigo-600 text-white shadow hover:bg-indigo-700 active:bg-indigo-800',
      destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800',
      outline: 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800',
      secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
      link: 'text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-base',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
