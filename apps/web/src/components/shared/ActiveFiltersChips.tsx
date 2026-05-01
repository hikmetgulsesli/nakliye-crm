import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface ActiveFilter {
  key: string;
  /** Etiket: "Durum" gibi alan adı */
  label: string;
  /** Değer: "Aktif" gibi okunabilir metin */
  value: string;
  /** Kaldır tıklandığında çağrılır */
  onRemove: () => void;
}

interface ActiveFiltersChipsProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
  className?: string;
}

/**
 * Seçilen filtreleri rozet olarak listeler. Her rozet tek tıkla
 * kaldırılabilir; "Tümünü temizle" linki sağda.
 */
export function ActiveFiltersChips({ filters, onClearAll, className }: ActiveFiltersChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary"
        >
          <span className="text-primary/70 dark:text-primary/80">{f.label}:</span>
          <span>{f.value}</span>
          <button
            type="button"
            onClick={f.onRemove}
            aria-label={`${f.label} filtresini kaldir`}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20 dark:hover:bg-primary/30"
          >
            <Icon name="close" size="sm" className="!text-[14px]" />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
        >
          Tümünü temizle
        </button>
      )}
    </div>
  );
}
