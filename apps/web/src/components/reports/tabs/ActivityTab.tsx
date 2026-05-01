import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { analyticsService, type AnalyticsFilters, type ActivityHeatmapData } from '@/services/analytics.service';
import { formatNumber } from '../formatters';
import { cn } from '@/utils/cn';

interface ActivityTabProps {
  filters: AnalyticsFilters;
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const TYPE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#94a3b8'];

export function ActivityTab({ filters }: ActivityTabProps) {
  const [data, setData] = useState<ActivityHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getActivityHeatmap(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Aktivite verileri yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const heatmap = data?.heatmap ?? Array.from({ length: 7 }, () => Array(24).fill(0));
  const maxHeat = useMemo(() => {
    let m = 0;
    for (const row of heatmap) for (const v of row) if (v > m) m = v;
    return Math.max(1, m);
  }, [heatmap]);

  // Saatlik toplam (column totals)
  const hourTotals = useMemo(() => {
    const arr = Array(24).fill(0);
    for (const row of heatmap) {
      for (let h = 0; h < 24; h++) arr[h] += row[h];
    }
    return arr.map((count, hour) => ({ hour: `${hour}:00`, count }));
  }, [heatmap]);

  // Gunluk toplam
  const dayTotals = useMemo(() => {
    return heatmap.map((row, i) => ({
      day: DAYS[i],
      count: row.reduce((a, b) => a + b, 0),
    }));
  }, [heatmap]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const byUser = data?.byUser ?? [];
  const byType = data?.byType ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="history"
          label="Toplam Aktivite"
          value={loading ? '…' : formatNumber(summary?.totalActivities ?? 0)}
          tone="indigo"
        />
        <KPICard
          icon="schedule"
          label="Toplam Süre"
          value={loading ? '…' : `${formatNumber(Math.round((summary?.totalMinutes ?? 0) / 60))} sa`}
          hint={`${formatNumber(summary?.totalMinutes ?? 0)} dakika`}
          tone="amber"
        />
        <KPICard
          icon="today"
          label="Günlük Ortalama"
          value={loading ? '…' : formatNumber(summary?.avgPerDay ?? 0)}
          tone="emerald"
        />
        <KPICard
          icon="category"
          label="Aktivite Tipi"
          value={loading ? '…' : formatNumber(byType.length)}
          tone="violet"
        />
      </div>

      {/* Heatmap */}
      <ChartCard
        title="Aktivite Isı Haritası"
        subtitle="Hafta günü ve saat bazında yoğunluk (Pzt-Paz)"
        icon="grid_on"
        loading={loading}
        empty={!loading && summary?.totalActivities === 0}
      >
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Saat etiketleri */}
            <div className="mb-1 flex items-center gap-1 pl-12">
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  className="w-6 text-center text-[10px] tabular-nums text-slate-400"
                >
                  {h % 3 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {/* Cells */}
            {DAYS.map((day, di) => (
              <div key={day} className="mb-1 flex items-center gap-1">
                <div className="w-12 text-xs font-medium text-slate-500 dark:text-slate-400">{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const v = heatmap[di][h];
                  const intensity = v / maxHeat;
                  const opacity = v === 0 ? 0 : 0.15 + intensity * 0.85;
                  return (
                    <div
                      key={h}
                      title={`${day} ${h}:00 — ${v} aktivite`}
                      className={cn(
                        'h-6 w-6 rounded-md border border-slate-100 transition-transform hover:scale-110 dark:border-slate-800',
                        v === 0 && 'bg-slate-50 dark:bg-slate-800/50',
                      )}
                      style={
                        v > 0
                          ? { backgroundColor: `rgba(99, 102, 241, ${opacity})` }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="mt-3 flex items-center gap-2 pl-12 text-[11px] text-slate-500">
              <span>Az</span>
              <div className="flex gap-0.5">
                {[0.15, 0.35, 0.55, 0.75, 1].map((op) => (
                  <div
                    key={op}
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: `rgba(99, 102, 241, ${op})` }}
                  />
                ))}
              </div>
              <span>Çok</span>
              <span className="ml-4 text-slate-400">En yoğun: {formatNumber(maxHeat)} aktivite</span>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Day & Hour bars */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Gün Bazında Aktivite"
          icon="calendar_today"
          loading={loading}
          empty={!loading && dayTotals.every((d) => d.count === 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayTotals} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Aktivite']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Saat Bazında Aktivite"
          icon="schedule"
          loading={loading}
          empty={!loading && hourTotals.every((h) => h.count === 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourTotals} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Aktivite']}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Type & User */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Aktivite Tipi"
          icon="donut_small"
          loading={loading}
          empty={!loading && byType.length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {byType.map((t, i) => (
                    <Cell key={t.type} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Aktivite']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Temsilci Bazında Aktivite"
          icon="leaderboard"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && byUser.length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byUser}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="fullName"
                  type="category"
                  width={140}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Aktivite']}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
