import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';
import { cn } from '@/utils/cn';

interface CustomerAISummaryProps {
  customerId: number;
  /** Mount'ta otomatik yukle (default true). False ise butona tiklanmasi beklenir. */
  autoLoad?: boolean;
}

interface SummaryData {
  context: {
    customer: { name: string };
    metrics: {
      totalQuotes: number;
      wonQuotes: number;
      lostQuotes: number;
      pendingQuotes: number;
      wonValue: Record<string, number>;
      activeShipments: number;
      activitiesLast90d: number;
    };
  };
  summary: string;
}

/**
 * Müşteri detay sayfasında "görüşme öncesi hızlı brifing" kartı.
 * Backend bağlamsal metrikleri toparlar, AI 3-5 cümlelik Türkçe özet üretir.
 */
export function CustomerAISummary({ customerId, autoLoad = true }: CustomerAISummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await aiService.customerSummary(customerId);
      setData(r);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        e.response?.data?.message ??
          e.message ??
          'AI özeti alınamadı. Sistem Ayarları > AI Sağlayıcılar bölümünden bir sağlayıcı yapılandırın.',
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: 'linear-gradient(180deg, var(--bg-subtle), var(--bg-panel))',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="grid size-7 place-items-center rounded-md text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--magenta))' }}
        >
          <Icon name="auto_awesome" size="sm" className="!text-[14px]" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-token-muted">
            AI Özeti
          </div>
          <div className="text-[12px] text-token-subtle">Görüşme öncesi hızlı brifing</div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          title="Yeniden üret"
          aria-label="Yeniden üret"
          className={cn(
            'grid size-7 place-items-center rounded-md text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text',
            loading && 'cursor-wait',
          )}
        >
          <Icon
            name={loading ? 'progress_activity' : 'refresh'}
            size="sm"
            className={cn('!text-[14px]', loading && 'animate-spin')}
          />
        </button>
      </div>

      <div className="mt-3 min-h-[56px] text-[13px] leading-relaxed text-token-text">
        {loading && !data ? (
          <div className="space-y-1.5">
            <div className="h-3 w-11/12 rounded bg-token-bg-subtle" />
            <div className="h-3 w-10/12 rounded bg-token-bg-subtle" />
            <div className="h-3 w-9/12 rounded bg-token-bg-subtle" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <Icon name="error" size="sm" className="mr-1 !text-[13px] align-text-bottom" />
            {error}
          </div>
        ) : data?.summary ? (
          <div
            className="prose-sm prose-tight text-token-text"
            // markdown-bold ** ... ** stilini destekliyoruz, baska bir markdown
            // beklemiyoruz (model'in cikti formati basit metin).
            dangerouslySetInnerHTML={{
              __html: data.summary
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        ) : (
          <div className="text-token-subtle">
            "Yeniden üret" tuşuna basarak özeti oluştur.
          </div>
        )}
      </div>

      {data && !loading && !error && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-token-border pt-3 text-[11px] text-token-muted">
          <span>Toplam teklif: <strong className="text-token-text">{data.context.metrics.totalQuotes}</strong></span>
          <span>· Kazanılan: <strong className="text-token-text">{data.context.metrics.wonQuotes}</strong></span>
          <span>· Bekleyen: <strong className="text-token-text">{data.context.metrics.pendingQuotes}</strong></span>
          <span>· Aktif sevkiyat: <strong className="text-token-text">{data.context.metrics.activeShipments}</strong></span>
          <span>· 90g aktivite: <strong className="text-token-text">{data.context.metrics.activitiesLast90d}</strong></span>
        </div>
      )}
    </div>
  );
}
