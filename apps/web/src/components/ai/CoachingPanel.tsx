import { useEffect, useState } from 'react';
import { Modal, Button, Skeleton, Icon } from '@/components/ui';
import api from '@/config/api';

interface CoachingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

interface Insight {
  title: string;
  detail: string;
  priority: 'low' | 'medium' | 'high';
}

interface Data {
  userId: number;
  userName: string;
  stats: {
    totalQuotes: number;
    wonQuotes: number;
    lostQuotes: number;
    winRate: number;
    avgTimeToClose: number | null;
    totalActivities: number;
    lossReasonBreakdown: Record<string, number>;
  };
  insights: Insight[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  medium: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  low: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

export function CoachingPanel({ isOpen, onClose, userId, userName }: CoachingPanelProps) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    api
      .get<Data>(`/ai/coaching/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || 'Koçluk önerileri üretilemedi.'),
      )
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🎯 Koçluk Önerileri — ${userName}`}
      className="!max-w-2xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Kapat
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton variant="text" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Toplam Teklif" value={data.stats.totalQuotes.toString()} />
            <Stat
              label="Kazanma"
              value={`%${data.stats.winRate}`}
              highlight={data.stats.winRate >= 50}
            />
            <Stat
              label="Ort. Kapanma"
              value={
                data.stats.avgTimeToClose != null
                  ? `${data.stats.avgTimeToClose} gün`
                  : '-'
              }
            />
            <Stat label="Aktivite" value={data.stats.totalActivities.toString()} />
          </div>

          {/* Insights */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              AI Önerileri ({data.insights.length})
            </h3>
            <div className="space-y-3">
              {data.insights.map((ins, i) => (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-3 ${PRIORITY_STYLES[ins.priority]}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className="font-semibold text-sm">{ins.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/60 dark:bg-black/30">
                      {PRIORITY_LABELS[ins.priority]}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">{ins.detail}</p>
                </div>
              ))}
              {data.insights.length === 0 && (
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Icon name="info" size="sm" />
                  Analiz için yeterli veri yok (en az 5 kapalı teklif önerilir).
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border ${
        highlight
          ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{label}</div>
      <div
        className={`mt-1 text-lg font-bold ${
          highlight
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
