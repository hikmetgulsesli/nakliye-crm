import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  title?: string;
  action?: ReactNode;
  noPadding?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, action, noPadding = false, className, children }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm',
        !noPadding && 'p-6',
        className,
      )}
    >
      {(title || action) && (
        <div
          className={cn(
            'flex items-center justify-between',
            noPadding ? 'px-6 pt-6 pb-4' : 'mb-4',
          )}
        >
          {title && (
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
