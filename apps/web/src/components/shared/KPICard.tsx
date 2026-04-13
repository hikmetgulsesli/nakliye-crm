import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

interface KPICardProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
};

export function KPICard({
  icon,
  iconColor = 'blue',
  label,
  value,
  trend,
  className,
}: KPICardProps) {
  const colors = colorMap[iconColor] || colorMap.blue;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex items-center justify-center size-12 rounded-xl',
            colors.bg,
          )}
        >
          <Icon name={icon} className={colors.text} />
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700',
            )}
          >
            <Icon
              name={trend.positive ? 'trending_up' : 'trending_down'}
              size="sm"
            />
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
