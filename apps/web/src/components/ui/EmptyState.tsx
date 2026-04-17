import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      <div className="flex items-center justify-center size-16 rounded-full bg-slate-100 text-slate-400 mb-4 dark:bg-slate-800 dark:text-slate-500">
        <Icon name={icon} size="lg" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
