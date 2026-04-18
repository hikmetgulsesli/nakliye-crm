import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface ChurnRiskRow {
  id: number;
  customerId: number;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  signals: Array<{ name: string; impact: number; detail: string }>;
  computedAt: string;
  customer?: {
    id: number;
    companyName: string;
    assignedUser?: { fullName: string };
    potential?: string | null;
  };
}

const LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

const LEVEL_LABELS: Record<string, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

export function ChurnRiskWidget({ limit = 5 }: { limit?: number }) {
  const [rows, setRows] = useState<ChurnRiskRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/ai/churn-risk?level=high&limit=${limit}`)
      .then((res) => {
        const critical = res.data || [];
        // Aynı zamanda critical olanları da çek
        return api
          .get(`/ai/churn-risk?level=critical&limit=${limit}`)
          .then((res2) => {
            const merged = [...res2.data, ...critical].slice(0, limit);
            setRows(merged);
          });
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <Card title="⚠️ Risk Altındaki Müşteriler">
      {loading && !rows ? (
        <div className="space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-2">
          <Icon name="check_circle" size="sm" className="text-emerald-500" />
          Şu anda yüksek riskli müşteri yok.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <Link
                to={`/musteriler/${r.customerId}`}
                className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors"
              >
                <div className={`size-2 rounded-full ${LEVEL_COLORS[r.level]}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                    {r.customer?.companyName || `#${r.customerId}`}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {r.signals[0]?.name}: {r.signals[0]?.detail}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {r.score}
                  </div>
                  <div className="text-xs text-slate-500">{LEVEL_LABELS[r.level]}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
