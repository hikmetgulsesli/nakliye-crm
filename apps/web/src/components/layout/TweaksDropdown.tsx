import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';

const ACCENTS = [
  { value: 'blue', label: 'Elektrik', color: 'oklch(62% 0.22 255)' },
  { value: 'magenta', label: 'Magenta', color: 'oklch(60% 0.24 340)' },
  { value: 'lime', label: 'Lime', color: 'oklch(78% 0.20 130)' },
] as const;

const DENSITIES = [
  { value: 'comfortable', label: 'Ferah' },
  { value: 'compact', label: 'Yoğun' },
] as const;

/**
 * Tasarımdaki "Tweaks" panelinin uygulamadaki kompakt karşılığı: Topbar'da
 * settings ikonu — açılınca aksan/yoğunluk seçimi.
 */
export function TweaksDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const accent = useThemeStore((s) => s.accent);
  const density = useThemeStore((s) => s.density);
  const setAccent = useThemeStore((s) => s.setAccent);
  const setDensity = useThemeStore((s) => s.setDensity);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Görünüm ayarları"
        aria-label="Görünüm ayarları"
        className={cn(
          'grid size-8 place-items-center rounded-md transition-colors',
          open
            ? 'bg-token-bg-hover text-token-text'
            : 'text-token-muted hover:bg-token-bg-hover hover:text-token-text',
        )}
      >
        <Icon name="tune" size="sm" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-1.5 w-64 overflow-hidden rounded-lg border border-token-border bg-token-bg-elev shadow-token-lg"
        >
          <div className="border-b border-token-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
            Görünüm
          </div>

          {/* Accent */}
          <div className="px-3 pt-2.5">
            <div className="mb-1.5 text-[11px] font-medium text-token-muted">Aksan</div>
            <div className="flex gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAccent(a.value)}
                  title={a.label}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                    accent === a.value
                      ? 'border-token-border-strong bg-token-bg-subtle text-token-text'
                      : 'border-token-border text-token-muted hover:bg-token-bg-hover hover:text-token-text',
                  )}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: a.color }}
                  />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="px-3 pb-3 pt-3">
            <div className="mb-1.5 text-[11px] font-medium text-token-muted">Satır yoğunluğu</div>
            <div className="flex gap-1.5">
              {DENSITIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDensity(d.value)}
                  className={cn(
                    'flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                    density === d.value
                      ? 'border-token-border-strong bg-token-bg-subtle text-token-text'
                      : 'border-token-border text-token-muted hover:bg-token-bg-hover hover:text-token-text',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-token-border bg-token-bg-subtle px-3 py-1.5 text-[10px] text-token-subtle">
            Tercihler bu cihazda saklanır.
          </div>
        </div>
      )}
    </div>
  );
}
