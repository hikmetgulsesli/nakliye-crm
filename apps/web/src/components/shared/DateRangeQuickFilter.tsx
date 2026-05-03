import { useMemo } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_PRESETS: { label: string; daysBack: number }[] = [
  { label: 'Son 7 gün', daysBack: 7 },
  { label: 'Son 30 gün', daysBack: 30 },
  { label: 'Son 90 gün', daysBack: 90 },
];

interface DateRangeQuickFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string | undefined, endDate: string | undefined) => void;
  presets?: { label: string; daysBack: number }[];
  label?: string;
  className?: string;
}

/**
 * Filtre üst barına gömülen kompakt tarih aralığı kontrolü.
 * - Preset chip'leri (toggle: aktif olana tekrar tıklanırsa temizler)
 * - Manuel başlangıç/bitiş input'ları
 * - En az bir tarih dolu olduğunda "X temizle" butonu
 */
export function DateRangeQuickFilter({
  startDate,
  endDate,
  onChange,
  presets = DEFAULT_PRESETS,
  label = 'Tarih',
  className,
}: DateRangeQuickFilterProps) {
  const today = useMemo(() => new Date(), []);
  const todayIso = isoDay(today);

  function presetRange(daysBack: number) {
    const start = new Date(today);
    start.setDate(today.getDate() - daysBack);
    return { start: isoDay(start), end: todayIso };
  }

  function isPresetActive(daysBack: number) {
    if (!startDate || !endDate) return false;
    const r = presetRange(daysBack);
    return r.start === startDate && r.end === endDate;
  }

  const hasAnyDate = !!(startDate || endDate);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Icon name="event" size="sm" />
        {label}
      </span>

      {presets.map((p) => {
        const active = isPresetActive(p.daysBack);
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              if (active) {
                onChange(undefined, undefined);
              } else {
                const r = presetRange(p.daysBack);
                onChange(r.start, r.end);
              }
            }}
            aria-pressed={active}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-white shadow-sm hover:bg-primary/90'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
            )}
          >
            {p.label}
          </button>
        );
      })}

      <div className="ml-1 flex items-center gap-1.5">
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onChange(e.target.value || undefined, endDate)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
          aria-label="Başlangıç tarihi"
        />
        <span className="text-slate-400">→</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onChange(startDate, e.target.value || undefined)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
          aria-label="Bitiş tarihi"
        />
      </div>

      {hasAnyDate && (
        <button
          type="button"
          onClick={() => onChange(undefined, undefined)}
          className="inline-flex size-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          aria-label="Tarihi temizle"
          title="Tarih filtresini temizle"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
