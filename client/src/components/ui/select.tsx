import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
