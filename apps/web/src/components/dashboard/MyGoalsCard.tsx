import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface Goal {
  id: number;
  metric: string;
  target: number;
  current: number;
  percent: number;
  periodEnd: string;
  notes?: string | null;
}

const METRIC_LABELS: Record<string, string> = {
  quote_count: 'Teklif Sayısı',
  won_count: 'Kazanılan Teklif',
  revenue: 'Ciro',
  activity_count: 'Aktivite Sayısı',
};

export function MyGoalsCard() {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Goal[]>('/goals/my-progress')
      .then((res) => setGoals(res.data))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Card title="🎯 Hedeflerim">
        <Skeleton variant="text" />
      </Card>
    );

  return (
    <Card title="🎯 Hedeflerim">
      {!goals || goals.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">Şu an açık hedef yok.</p>
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => (
            <li key={g.id}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium">{METRIC_LABELS[g.metric] || g.metric}</span>
                <span className="text-xs text-slate-500">
                  {g.current.toLocaleString('tr-TR')} / {g.target.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all',
                    g.percent >= 100
                      ? 'bg-emerald-500'
                      : g.percent >= 60
                        ? 'bg-amber-400'
                        : 'bg-blue-500',
                  ].join(' ')}
                  style={{ width: `${g.percent}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                %{g.percent} ·
                Bitiş: {new Date(g.periodEnd).toLocaleDateString('tr-TR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
