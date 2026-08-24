import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center font-medium text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 select-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  if (!src) return null;
  return <img src={src} alt={alt || 'Avatar'} className={cn('aspect-square h-full w-full object-cover', className)} />;
}

export function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <span className={cn('flex h-full w-full items-center justify-center font-semibold uppercase', className)}>{children}</span>;
}
