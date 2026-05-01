import { useMemo } from 'react';
import { DatePicker, MultiSelect, Select, Icon } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import { cn } from '@/utils/cn';
import type { AnalyticsFilters } from '@/services/analytics.service';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  users: { value: string; label: string }[];
  className?: string;
}

type PresetKey = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'last90' | 'custom';

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Bugün' },
  { key: 'thisWeek', label: 'Bu Hafta' },
  { key: 'thisMonth', label: 'Bu Ay' },
  { key: 'lastMonth', label: 'Geçen Ay' },
  { key: 'thisQuarter', label: 'Bu Çeyrek' },
  { key: 'last90', label: 'Son 90 Gün' },
  { key: 'thisYear', label: 'Bu Yıl' },
];

const CURRENCY_OPTIONS = [
  { value: '', label: 'Tüm Para Birimleri' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'TRY', label: 'TRY' },
];

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function presetRange(key: PresetKey): { start: string; end: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case 'today':
      return { start: isoDay(today), end: isoDay(today) };
    case 'thisWeek': {
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return { start: isoDay(start), end: isoDay(today) };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: isoDay(start), end: isoDay(today) };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: isoDay(start), end: isoDay(end) };
    }
    case 'thisQuarter': {
      const q = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), q * 3, 1);
      return { start: isoDay(start), end: isoDay(today) };
    }
    case 'last90': {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return { start: isoDay(start), end: isoDay(today) };
    }
    case 'thisYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start: isoDay(start), end: isoDay(today) };
    }
    default:
      return null;
  }
}

function detectActivePreset(filters: AnalyticsFilters): PresetKey {
  if (!filters.startDate || !filters.endDate) return 'thisMonth';
  for (const p of PRESETS) {
    const r = presetRange(p.key);
    if (r && r.start === filters.startDate && r.end === filters.endDate) return p.key;
  }
  return 'custom';
}

export function AnalyticsFilterBar({ filters, onChange, users, className }: AnalyticsFilterBarProps) {
  const { getOptions } = useLookups();
  const transportModeOptions = useMemo(() => {
    const opts = getOptions('transport_mode');
    return [{ value: '', label: 'Tüm Modlar' }, ...opts];
  }, [getOptions]);

  const activePreset = detectActivePreset(filters);

  function applyPreset(key: PresetKey) {
    const r = presetRange(key);
    if (!r) return;
    onChange({ ...filters, startDate: r.start, endDate: r.end });
  }

  function clearAll() {
    const r = presetRange('thisMonth')!;
    onChange({ startDate: r.start, endDate: r.end });
  }

  const userValues = (filters.assignedUserIds ?? []).map(String);
  const hasFilters =
    (filters.assignedUserIds && filters.assignedUserIds.length > 0) ||
    !!filters.transportMode ||
    !!filters.currency;

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {/* Preset chips */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Dönem
        </span>
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              {p.label}
            </button>
          );
        })}
        {activePreset === 'custom' && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Özel
          </span>
        )}
        <div className="ml-auto" />
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300"
          >
            <Icon name="restart_alt" size="sm" className="!text-[14px]" />
            Sıfırla
          </button>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-2">
          <DatePicker
            label="Başlangıç"
            value={filters.startDate ?? ''}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
          />
        </div>
        <div className="lg:col-span-2">
          <DatePicker
            label="Bitiş"
            value={filters.endDate ?? ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
          />
        </div>
        <div className="lg:col-span-4">
          <MultiSelect
            label="Temsilciler"
            options={users}
            value={userValues}
            onChange={(values) =>
              onChange({
                ...filters,
                assignedUserIds: values.length > 0 ? values.map(Number) : undefined,
              })
            }
            placeholder="Tüm temsilciler"
          />
        </div>
        <div className="lg:col-span-2">
          <Select
            label="Taşıma Modu"
            value={filters.transportMode ?? ''}
            onChange={(e) =>
              onChange({ ...filters, transportMode: e.target.value || undefined })
            }
            options={transportModeOptions}
          />
        </div>
        <div className="lg:col-span-2">
          <Select
            label="Para Birimi"
            value={filters.currency ?? ''}
            onChange={(e) =>
              onChange({ ...filters, currency: e.target.value || undefined })
            }
            options={CURRENCY_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
