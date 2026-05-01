import { cn } from '@/utils/cn';

export interface SavedView {
  /** Benzersiz id */
  id: string;
  /** Etiket */
  label: string;
  /** Sag tarafta gosterilecek sayac (opsiyonel) */
  count?: number;
  /** Sol tarafta renk noktasi (opsiyonel) — token rengi ya da CSS rengi */
  color?: string;
}

interface SavedViewsTabsProps {
  views: SavedView[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  /** Sag uca konacak ekstra elemanlar (ornegin "+ Görünüm ekle") */
  trailing?: React.ReactNode;
}

/**
 * Tasarımdaki saved-views tab şeridi: liste sayfalarının üstünde.
 *
 *  ┌─────┬─────┬─────────────┐
 *  │Tümü │Aktif│Risk altında │ ...
 *  └─────┴─────┴─────────────┘
 *
 * Saf kontrollü bileşen — aktif id ve değişim callback'i parent'tan alınır.
 */
export function SavedViewsTabs({
  views,
  activeId,
  onChange,
  className,
  trailing,
}: SavedViewsTabsProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-0.5 overflow-x-auto border-b border-token-border bg-token-bg-panel px-3',
        className,
      )}
    >
      {views.map((v) => {
        const active = v.id === activeId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={cn(
              'group inline-flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-2 text-[12px] font-medium transition-colors',
              active
                ? 'border-token-border bg-token-bg text-token-text -mb-px'
                : 'border-transparent text-token-muted hover:text-token-text',
            )}
          >
            {v.color && (
              <span
                className="size-1.5 rounded-full"
                style={{ background: v.color }}
              />
            )}
            <span>{v.label}</span>
            {v.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px]',
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'bg-token-bg-subtle text-token-subtle',
                )}
              >
                {v.count}
              </span>
            )}
          </button>
        );
      })}
      {trailing && (
        <div className="ml-auto flex items-center pb-2 pl-2">{trailing}</div>
      )}
    </div>
  );
}
