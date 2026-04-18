import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface LeaderboardEntry {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  won: number;
  total: number;
  winRate: number;
  activities: number;
  badges: number;
  points: number;
}

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/gamification/leaderboard?days=30')
      .then((res) => setEntries(res.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Card title="🏆 Ekip Sıralaması">
        <Skeleton variant="text" />
      </Card>
    );

  return (
    <Card title="🏆 Ekip Sıralaması (30 gün)">
      {!entries || entries.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">Veri yok.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="w-8 text-center text-lg">{medal}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{e.fullName}</div>
                  <div className="text-xs text-slate-500">
                    {e.won} kazandı · %{Math.round(e.winRate * 100)} · {e.badges} rozet
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{e.points}</div>
                  <div className="text-xs text-slate-500">puan</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
