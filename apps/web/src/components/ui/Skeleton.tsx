import { cn } from '@/utils/cn';

type SkeletonVariant = 'text' | 'circle' | 'card' | 'table-row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

function SkeletonItem({ variant = 'text', className }: Omit<SkeletonProps, 'count'>) {
  switch (variant) {
    case 'circle':
      return (
        <div className={cn('animate-pulse bg-slate-200 rounded-full size-10', className)} />
      );
    case 'card':
      return (
        <div
          className={cn(
            'animate-pulse bg-white rounded-2xl border border-slate-200 p-6 space-y-4',
            className,
          )}
        >
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      );
    case 'table-row':
      return (
        <div
          className={cn(
            'animate-pulse flex items-center gap-4 px-6 py-4 border-b border-slate-100',
            className,
          )}
        >
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/5" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/12" />
        </div>
      );
    default:
      return (
        <div className={cn('animate-pulse bg-slate-200 rounded h-4 w-full', className)} />
      );
  }
}

export function Skeleton({ variant = 'text', className, count = 1 }: SkeletonProps) {
  if (count === 1) {
    return <SkeletonItem variant={variant} className={className} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonItem key={i} variant={variant} className={className} />
      ))}
    </div>
  );
}
