import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  /** Onceki doneme gore yuzde degisim ("%+12" gibi) */
  trend?: { value: number; positive: boolean; label: string };
  /** Renk paleti */
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'indigo';
  /** Alt metin: ek aciklama */
  hint?: string;
  /** Tiklanabilir link (orn. /teklifler?status=Bekliyor) */
  href?: string;
  className?: string;
}

const TONE_MAP: Record<NonNullable<KPICardProps['tone']>, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-300', ring: 'ring-blue-500/10' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-emerald-500/10' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300', ring: 'ring-amber-500/10' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-300', ring: 'ring-rose-500/10' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-300', ring: 'ring-violet-500/10' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-500/10' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-300', ring: 'ring-indigo-500/10' },
};

export function KPICard({ icon, label, value, trend, tone = 'blue', hint, href, className }: KPICardProps) {
  const t = TONE_MAP[tone];
  const baseClasses = cn(
    'block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900',
    href ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-transform' : 'hover:shadow-md',
    className,
  );

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('flex size-10 items-center justify-center rounded-xl ring-1', t.bg, t.ring)}>
          <Icon name={icon} size="md" className={t.text} />
        </div>
        <div className="flex items-center gap-1.5">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
              )}
            >
              <Icon name={trend.positive ? 'trending_up' : 'trending_down'} size="sm" className="!text-[14px]" />
              {trend.label}
            </span>
          )}
          {href && (
            <Icon name="arrow_outward" size="sm" className="!text-[14px] text-slate-400" />
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
        <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        {hint && <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{hint}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={baseClasses}>
        {inner}
      </Link>
    );
  }
  return <div className={baseClasses}>{inner}</div>;
}
