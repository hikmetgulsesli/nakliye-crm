import { cn } from '@/utils/cn';

interface RankingItem {
  label: string;
  /** Sag ust gosterilen ana metrik */
  primary: string | number;
  /** Sol bilgi alti aciklama (opsiyonel) */
  hint?: string;
  /** Bar yuzdesi (0-100) */
  percentage?: number;
  /** Bar rengi (Tailwind sinif adi) */
  barColor?: string;
}

interface RankingListProps {
  items: RankingItem[];
  emptyText?: string;
  /** Maksimum gosterilecek satir */
  max?: number;
  className?: string;
}

export function RankingList({ items, emptyText = 'Veri yok', max = 10, className }: RankingListProps) {
  if (items.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">{emptyText}</div>;
  }
  const list = items.slice(0, max);

  return (
    <ul className={cn('space-y-3', className)}>
      {list.map((item, idx) => {
        const pct = Math.max(0, Math.min(100, item.percentage ?? 0));
        return (
          <li key={`${item.label}-${idx}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {item.label}
                  </div>
                  {item.hint && (
                    <div className="truncate text-xs text-slate-400 dark:text-slate-500">{item.hint}</div>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.primary}
              </span>
            </div>
            {item.percentage !== undefined && (
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn('h-full rounded-full transition-all', item.barColor || 'bg-primary')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
