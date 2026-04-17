import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
  danger:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
  info:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30',
  neutral:
    'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-700/60 dark:text-slate-200 dark:ring-slate-500/30',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold ring-1 ring-inset whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
