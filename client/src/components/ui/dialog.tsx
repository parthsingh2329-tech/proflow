import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100', className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props}>{children}</p>;
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props}>{children}</div>;
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none dark:ring-offset-slate-950 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
