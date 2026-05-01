import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Avatar, Icon } from '@/components/ui';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { analyticsService, type AnalyticsFilters, type TeamPerformanceData } from '@/services/analytics.service';
import { formatNumber, formatPercent, formatRelative, formatMultiCurrency } from '../formatters';
import { cn } from '@/utils/cn';

interface TeamTabProps {
  filters: AnalyticsFilters;
}

export function TeamTab({ filters }: TeamTabProps) {
  const [data, setData] = useState<TeamPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getTeamPerformance(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Takım performans verileri yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const members = data?.members ?? [];
  const summary = data?.summary;

  // Karsilastirmali bar chart icin (en iyi 8 kisi)
  const compareData = members.slice(0, 8).map((m) => ({
    name: m.fullName.split(' ')[0],
    Verilen: m.totalQuotes,
    Kazanilan: m.wonQuotes,
    Aktivite: m.activities,
  }));

  // Radar icin en iyi 5 (normalize edilmis)
  const maxQuotes = Math.max(1, ...members.map((m) => m.totalQuotes));
  const maxWon = Math.max(1, ...members.map((m) => m.wonQuotes));
  const maxAct = Math.max(1, ...members.map((m) => m.activities));
  const maxCust = Math.max(1, ...members.map((m) => m.customers));
  const radarMembers = members.slice(0, 5);
  const radarData = [
    {
      metric: 'Teklif',
      ...Object.fromEntries(radarMembers.map((m) => [m.fullName, Math.round((m.totalQuotes / maxQuotes) * 100)])),
    },
    {
      metric: 'Kazanılan',
      ...Object.fromEntries(radarMembers.map((m) => [m.fullName, Math.round((m.wonQuotes / maxWon) * 100)])),
    },
    {
      metric: 'Kazanma %',
      ...Object.fromEntries(radarMembers.map((m) => [m.fullName, m.winRate])),
    },
    {
      metric: 'Aktivite',
      ...Object.fromEntries(radarMembers.map((m) => [m.fullName, Math.round((m.activities / maxAct) * 100)])),
    },
    {
      metric: 'Müşteri',
      ...Object.fromEntries(radarMembers.map((m) => [m.fullName, Math.round((m.customers / maxCust) * 100)])),
    },
  ];

  const radarColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Takim ozet KPI'lari */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="groups"
          label="Aktif Temsilci"
          value={loading ? '…' : formatNumber(members.length)}
          tone="indigo"
        />
        <KPICard
          icon="description"
          label="Takım Toplam Teklif"
          value={loading ? '…' : formatNumber(summary?.quotes ?? 0)}
          tone="blue"
        />
        <KPICard
          icon="emoji_events"
          label="Takım Kazanılan"
          value={loading ? '…' : formatNumber(summary?.won ?? 0)}
          tone="emerald"
        />
        <KPICard
          icon="track_changes"
          label="Takım Kazanma Oranı"
          value={loading ? '…' : formatPercent(summary?.winRate ?? 0)}
          tone="violet"
        />
      </div>

      {/* Karsilastirma cubuk + radar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Kişi Bazında Karşılaştırma"
          subtitle="Verilen, kazanılan teklif ve aktivite sayısı"
          icon="bar_chart"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && compareData.length === 0}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Verilen" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kazanilan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Aktivite" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Çok Boyutlu Profil"
          subtitle="İlk 5 temsilci, normalize edilmiş skor"
          icon="radar"
          loading={loading}
          empty={!loading && radarMembers.length === 0}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
                {radarMembers.map((m, i) => (
                  <Radar
                    key={m.userId}
                    dataKey={m.fullName}
                    stroke={radarColors[i]}
                    fill={radarColors[i]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Lider tablosu */}
      <ChartCard
        title="Lider Tablosu"
        subtitle="Kişi bazında detaylı performans"
        icon="leaderboard"
        loading={loading}
        empty={!loading && members.length === 0}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">#</th>
                <th className="px-5 py-3 text-left font-semibold">Temsilci</th>
                <th className="px-5 py-3 text-right font-semibold">Verilen</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanılan</th>
                <th className="px-5 py-3 text-right font-semibold">Kaybedilen</th>
                <th className="px-5 py-3 text-right font-semibold">Bekleyen</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanma %</th>
                <th className="px-5 py-3 text-right font-semibold">Aktivite</th>
                <th className="px-5 py-3 text-right font-semibold">Müşteri</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanılan Değer</th>
                <th className="px-5 py-3 text-right font-semibold">Son Aktivite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m, idx) => (
                <tr key={m.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 text-slate-500">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                        idx === 0
                          ? 'bg-amber-100 text-amber-700'
                          : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullName} src={m.avatarUrl ?? undefined} size="sm" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{m.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {m.role === 'ADMIN' ? 'Yönetici' : 'Temsilci'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(m.totalQuotes)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                      {formatNumber(m.wonQuotes)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-rose-600 dark:text-rose-300">
                    {formatNumber(m.lostQuotes)}
                  </td>
                  <td className="px-5 py-3 text-right text-blue-600 dark:text-blue-300">
                    {formatNumber(m.pendingQuotes)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold tabular-nums">{formatPercent(m.winRate)}</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            m.winRate >= 60 ? 'bg-emerald-500' : m.winRate >= 30 ? 'bg-amber-500' : 'bg-rose-500',
                          )}
                          style={{ width: `${Math.min(100, m.winRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatNumber(m.activities)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatNumber(m.customers)}</td>
                  <td className="px-5 py-3 text-right text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatMultiCurrency(m.wonValue)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-slate-500 dark:text-slate-400">
                    {formatRelative(m.lastActivityAt)}
                  </td>
                </tr>
              ))}
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm text-slate-400">
                    Bu dönemde gösterilecek temsilci bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Hedef vs gerceklesen */}
      {!loading && members.some((m) => Object.keys(m.goals).length > 0) && (
        <ChartCard
          title="Hedef ve Gerçekleşen"
          subtitle="Tanımlı hedefi olan temsilcilerin tamamlama oranları"
          icon="flag"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members
              .filter((m) => Object.keys(m.goals).length > 0)
              .map((m) => (
                <div
                  key={m.userId}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar name={m.fullName} src={m.avatarUrl ?? undefined} size="sm" />
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {m.fullName}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(m.goals).map(([metric, g]) => {
                      const label =
                        metric === 'quote_count'
                          ? 'Teklif Sayısı'
                          : metric === 'won_count'
                            ? 'Kazanılan'
                            : metric === 'activity_count'
                              ? 'Aktivite'
                              : metric === 'revenue'
                                ? 'Gelir'
                                : metric;
                      return (
                        <div key={metric}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
                            <span className="tabular-nums text-slate-900 dark:text-slate-200">
                              {formatNumber(g.actual)} / {formatNumber(g.target)}{' '}
                              <span
                                className={cn(
                                  'ml-1 font-semibold',
                                  g.pct >= 100
                                    ? 'text-emerald-600 dark:text-emerald-300'
                                    : g.pct >= 60
                                      ? 'text-amber-600 dark:text-amber-300'
                                      : 'text-rose-600 dark:text-rose-300',
                                )}
                              >
                                {formatPercent(g.pct)}
                              </span>
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                g.pct >= 100
                                  ? 'bg-emerald-500'
                                  : g.pct >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500',
                              )}
                              style={{ width: `${Math.min(100, g.pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </ChartCard>
      )}

      {!loading && members.length > 0 && !members.some((m) => Object.keys(m.goals).length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
          <Icon name="info" size="sm" className="mr-1 align-text-bottom" />
          Bu dönemde tanımlı bir satış hedefi yok. Hedefler menüsünden temsilci/dönem bazlı hedef tanımlayabilirsiniz.
        </div>
      )}
    </div>
  );
}
