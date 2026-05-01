import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';
import { cn } from '@/utils/cn';

interface SignalItem {
  customerId: number;
  companyName: string;
  phone: string;
  priority: number;
  reasons: string[];
  lastContactDate: string | null;
  openQuoteCount: number;
}

/**
 * Tasarımdaki "AI sinyaller" stripi — smart-queue endpoint'inden temsilciye
 * önceliklendirilmiş müşteri listesi gelir, ilk 3'ü kart olarak gösterilir.
 * Kullanıcı tıkladığında müşteri detayında AI özet flow'u devreye girer.
 */
export function AISignalsStrip() {
  const [items, setItems] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    aiService
      .smartQueue()
      .then((data) => {
        if (!cancelled) setItems(data.slice(0, 3));
      })
      .catch((err) => {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        if (!cancelled) setError(e.response?.data?.message ?? e.message ?? 'AI sinyalleri yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hata durumunda sessizce gizle (AI etkin değilse Dashboard'u doldurmasın)
  if (error || (!loading && items.length === 0)) return null;

  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border bg-token-bg-panel"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-token-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-7 place-items-center rounded-md text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--magenta))' }}
          >
            <Icon name="auto_awesome" size="sm" className="!text-[14px]" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-token-text">
              Bugün bunlarla konuş
            </div>
            <div className="text-[11px] text-token-muted">
              AI önceliklendirmesi · son 90 gün verisi
            </div>
          </div>
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-magenta-soft px-2 py-0.5 text-[11px] font-medium text-magenta">
            {items.length} öneri
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col gap-2 p-4',
                  i < 2 && 'md:border-r md:border-token-border',
                )}
              >
                <div className="h-4 w-24 rounded bg-token-bg-subtle" />
                <div className="h-5 w-3/4 rounded bg-token-bg-subtle" />
                <div className="h-3 w-2/3 rounded bg-token-bg-subtle" />
              </div>
            ))
          : items.map((item, i) => {
              const tone =
                item.priority >= 70
                  ? 'rose'
                  : item.priority >= 40
                    ? 'amber'
                    : 'emerald';
              return (
                <Link
                  key={item.customerId}
                  to={`/musteriler/${item.customerId}`}
                  className={cn(
                    'group flex flex-col gap-2 p-4 transition-colors hover:bg-token-bg-hover',
                    i < items.length - 1 && 'md:border-r md:border-token-border',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        tone === 'rose' &&
                          'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
                        tone === 'amber' &&
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                        tone === 'emerald' &&
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                      )}
                    >
                      <Icon name="flag" size="sm" className="!text-[10px]" />
                      {tone === 'rose' ? 'Yüksek öncelik' : tone === 'amber' ? 'Orta' : 'Takip'}
                    </span>
                    <span className="font-mono text-[10px] text-token-subtle">
                      P{item.priority}
                    </span>
                  </div>
                  <div className="text-[14px] font-semibold tracking-tight text-token-text group-hover:text-brand">
                    {item.companyName}
                  </div>
                  <div className="text-[12px] text-token-muted">
                    {item.reasons.slice(0, 2).join(' · ') || 'Uzun süredir temas yok'}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-token-subtle">
                    {item.openQuoteCount > 0 && (
                      <span>
                        <Icon
                          name="description"
                          size="sm"
                          className="!text-[12px] align-text-bottom"
                        />{' '}
                        {item.openQuoteCount} açık teklif
                      </span>
                    )}
                    <span>
                      <Icon name="phone" size="sm" className="!text-[12px] align-text-bottom" />{' '}
                      {item.phone}
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
