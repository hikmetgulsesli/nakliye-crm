import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  /** Sag ust eylem (sec, indir vb.) */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
}

export function ChartCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  bodyClassName,
  loading,
  empty,
  emptyText = 'Veri bulunamadi',
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800/70">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Icon name={icon} size="sm" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={cn('flex-1 p-5', bodyClassName)}>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            <Icon name="progress_activity" className="animate-spin" />
          </div>
        ) : empty ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-slate-400">
            <Icon name="bar_chart" className="!text-2xl text-slate-300 dark:text-slate-700" />
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
