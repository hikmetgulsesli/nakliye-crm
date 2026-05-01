import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import type { SavedView, SavedViewResource } from '@/services/saved-views.service';

export interface BuiltInView {
  /** Benzersiz id */
  id: string;
  /** Etiket */
  label: string;
  /** Sag tarafta gosterilecek sayac (opsiyonel) */
  count?: number;
  /** Sol tarafta renk noktasi (opsiyonel) */
  color?: string;
}

interface SavedViewsTabsProps {
  /** Sistem görünümleri (Tümü, durum bazlı vb.) — sayfa kontrolünde tutulur */
  views: BuiltInView[];
  /** Aktif sistem görünümünün id'si (eğer aktifse). Kullanıcı görünümü aktifse undefined verin. */
  activeId?: string;
  onChange: (id: string) => void;
  /** Saved views çekilecek scope (varsa kullanıcı kayıtlıları da listelenir) */
  resource?: SavedViewResource;
  /** Aktif user view (kullanıcı görünümü tıklanmışsa id) */
  activeUserViewId?: number;
  /** Kullanıcı görünümü tıklanınca filtreler uygulansın */
  onUserViewSelect?: (view: SavedView) => void;
  className?: string;
  /** Sag uca konacak ekstra elemanlar (ornegin "+ Görünüm Kaydet") */
  trailing?: React.ReactNode;
}

/**
 * Liste sayfalarının üstündeki tab şeridi. İki katman:
 *  1) Sistem görünümleri (built-in: Tümü/Bekliyor/...)
 *  2) Kullanıcının kayıtlı filtre görünümleri (resource'a göre)
 */
export function SavedViewsTabs({
  views,
  activeId,
  onChange,
  resource,
  activeUserViewId,
  onUserViewSelect,
  className,
  trailing,
}: SavedViewsTabsProps) {
  const all = useSavedViewsStore((s) => s.all);
  const removeView = useSavedViewsStore((s) => s.remove);
  const userViews = resource ? all.filter((v) => v.resource === resource) : [];
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleRemove(view: SavedView, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`"${view.name}" görünümü silinsin mi?`)) return;
    setRemovingId(view.id);
    try {
      await removeView(view.id);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div
      className={cn(
        'flex items-end gap-0.5 overflow-x-auto border-b border-token-border bg-token-bg-panel px-3',
        className,
      )}
    >
      {views.map((v) => {
        const active = !activeUserViewId && v.id === activeId;
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
              <span className="size-1.5 rounded-full" style={{ background: v.color }} />
            )}
            <span>{v.label}</span>
            {v.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px]',
                  active ? 'bg-brand-soft text-brand' : 'bg-token-bg-subtle text-token-subtle',
                )}
              >
                {v.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Kullanici kayitli görünümler */}
      {userViews.length > 0 && (
        <span className="mx-2 mb-2 h-4 w-px bg-token-border" aria-hidden="true" />
      )}
      {userViews.map((v) => {
        const active = activeUserViewId === v.id;
        const isRemoving = removingId === v.id;
        return (
          <div
            key={`u-${v.id}`}
            className={cn(
              'group relative inline-flex shrink-0 items-center rounded-t-md border border-b-0 px-1 transition-colors',
              active
                ? 'border-token-border bg-token-bg text-token-text -mb-px'
                : 'border-transparent text-token-muted hover:text-token-text',
              isRemoving && 'opacity-50',
            )}
          >
            <button
              type="button"
              onClick={() => onUserViewSelect?.(v)}
              className="inline-flex items-center gap-1.5 px-2 py-2 text-[12px] font-medium"
              title={v.isPinned ? 'Sol menüye sabitlenmiş' : ''}
            >
              {v.isPinned && (
                <Icon name="push_pin" size="sm" className="!text-[12px] text-token-subtle" />
              )}
              <span>{v.name}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleRemove(v, e)}
              title="Görünümü sil"
              aria-label="Görünümü sil"
              className="grid size-5 place-items-center rounded text-token-subtle opacity-0 transition-opacity hover:bg-token-bg-hover hover:text-rose-600 group-hover:opacity-100"
            >
              <Icon name="close" size="sm" className="!text-[13px]" />
            </button>
          </div>
        );
      })}

      {trailing && <div className="ml-auto flex items-center pb-2 pl-2">{trailing}</div>}
    </div>
  );
}

