import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui';
import { aiService } from '@/services/ai.service';

interface WinProbabilityBadgeProps {
  quotationId: number;
  status?: string;
}

interface Result {
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  signals: Array<{ name: string; impact: number; detail: string }>;
}

export function WinProbabilityBadge({ quotationId, status }: WinProbabilityBadgeProps) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Kapali teklifler icin tahmin gostermeye gerek yok
  const isClosedStatus = status === 'Kazanıldı' || status === 'Kaybedildi' || status === 'İptal';

  useEffect(() => {
    if (isClosedStatus) {
      setLoading(false);
      return;
    }
    aiService
      .winProbability(quotationId)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [quotationId, isClosedStatus]);

  if (isClosedStatus || (loading && !result)) return null;
  if (!result) return null;

  const tier =
    result.probability >= 70 ? 'high' : result.probability >= 40 ? 'med' : 'low';
  const colors = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    med: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    low: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  }[tier];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${colors}`}
        aria-label="AI kazanma ihtimali detayı"
      >
        <Icon name="auto_awesome" size="sm" />
        <span>AI: %{result.probability} kazanma</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size="sm" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 z-20 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Kazanma Sinyalleri
            </span>
            <span className="text-xs text-slate-500">
              {result.confidence === 'high'
                ? 'Yüksek güven'
                : result.confidence === 'medium'
                  ? 'Orta güven'
                  : 'Düşük güven'}
            </span>
          </div>
          <ul className="space-y-2">
            {result.signals.map((s, i) => (
              <li key={i} className="flex items-start justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium text-slate-700 dark:text-slate-200">{s.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.detail}</div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    s.impact > 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : s.impact < 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {s.impact > 0 ? '+' : ''}
                  {s.impact}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Heuristic model. Sadece bilgilendirme amaçlı.
          </div>
        </div>
      )}
    </div>
  );
}
