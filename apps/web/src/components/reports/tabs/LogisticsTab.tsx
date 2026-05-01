import { useEffect, useState } from 'react';
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
import { RankingList } from '../RankingList';
import { analyticsService, type AnalyticsFilters, type LaneAnalysisData } from '@/services/analytics.service';
import { formatNumber, formatPercent, formatCurrency } from '../formatters';
import { cn } from '@/utils/cn';

interface LogisticsTabProps {
  filters: AnalyticsFilters;
}

const MODE_COLORS: Record<string, string> = {
  Deniz: '#3b82f6',
  Kara: '#10b981',
  Hava: '#f59e0b',
  Demiryolu: '#94a3b8',
  Kombine: '#8b5cf6',
  Belirtilmemis: '#cbd5e1',
};

export function LogisticsTab({ filters }: LogisticsTabProps) {
  const [data, setData] = useState<LaneAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getLaneAnalysis(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Lojistik verileri yüklenemedi.');
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

  const lanes = data?.lanes ?? [];
  const origins = data?.origins ?? [];
  const destinations = data?.destinations ?? [];
  const modes = data?.transportModes ?? [];
  const services = data?.serviceTypes ?? [];
  const incoterms = data?.incoterms ?? [];

  const maxOrigin = Math.max(1, ...origins.map((o) => o.count));
  const maxDest = Math.max(1, ...destinations.map((o) => o.count));
  const maxService = Math.max(1, ...services.map((o) => o.count));
  const maxIncoterm = Math.max(1, ...incoterms.map((o) => o.count));

  const originItems = origins.map((o) => ({
    label: o.country,
    primary: formatNumber(o.count),
    percentage: Math.round((o.count / maxOrigin) * 100),
    barColor: 'bg-blue-500',
  }));
  const destItems = destinations.map((o) => ({
    label: o.country,
    primary: formatNumber(o.count),
    percentage: Math.round((o.count / maxDest) * 100),
    barColor: 'bg-emerald-500',
  }));
  const serviceItems = services.map((o) => ({
    label: o.service,
    primary: formatNumber(o.count),
    percentage: Math.round((o.count / maxService) * 100),
    barColor: 'bg-violet-500',
  }));
  const incoItems = incoterms.map((o) => ({
    label: o.incoterm,
    primary: formatNumber(o.count),
    percentage: Math.round((o.count / maxIncoterm) * 100),
    barColor: 'bg-amber-500',
  }));

  const topMode = modes[0]?.mode ?? '—';
  const topLane = lanes[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="local_shipping"
          label="Toplam Mod Çeşidi"
          value={loading ? '…' : formatNumber(modes.length)}
          tone="blue"
        />
        <KPICard
          icon="star"
          label="En Çok Kullanılan"
          value={loading ? '…' : topMode}
          tone="violet"
        />
        <KPICard
          icon="route"
          label="Aktif Güzergah"
          value={loading ? '…' : formatNumber(lanes.length)}
          tone="emerald"
        />
        <KPICard
          icon="trending_up"
          label="En Yoğun Güzergah"
          value={
            loading || !topLane
              ? '—'
              : `${topLane.origin} → ${topLane.destination}`
          }
          hint={topLane ? `${formatNumber(topLane.count)} teklif` : undefined}
          tone="amber"
        />
      </div>

      {/* Modes + Service */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Taşıma Modu Dağılımı"
          icon="donut_small"
          loading={loading}
          empty={!loading && modes.length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modes}
                  dataKey="count"
                  nameKey="mode"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {modes.map((m) => (
                    <Cell key={m.mode} fill={MODE_COLORS[m.mode] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v, name) => [`${formatNumber(Number(v))} teklif`, name as string]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Mod Bazında Kazanma Oranı"
          icon="track_changes"
          loading={loading}
          empty={!loading && modes.length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modes} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mode" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `%${v}`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [`%${Number(v)}`, 'Kazanma']}
                />
                <Bar dataKey="winRate" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {modes.map((m) => (
                    <Cell key={m.mode} fill={MODE_COLORS[m.mode] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Servis Tipleri"
          icon="local_offer"
          loading={loading}
          empty={!loading && serviceItems.length === 0}
        >
          <RankingList items={serviceItems} max={6} />
        </ChartCard>
      </div>

      {/* Lanes */}
      <ChartCard
        title="En Yoğun Güzergahlar"
        subtitle="Teklif sayısı, kazanma oranı ve kazanılan değer"
        icon="route"
        loading={loading}
        empty={!loading && lanes.length === 0}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Çıkış</th>
                <th className="px-5 py-3 text-left font-semibold">Varış</th>
                <th className="px-5 py-3 text-right font-semibold">Teklif</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanılan</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanma %</th>
                <th className="px-5 py-3 text-right font-semibold">Kazanılan Değer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lanes.map((l) => (
                <tr
                  key={`${l.origin}-${l.destination}`}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{l.origin}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="material-symbols-outlined text-base text-slate-400">arrow_forward</span>
                      {l.destination}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatNumber(l.count)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-300">
                    {formatNumber(l.won)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        l.winRate >= 60
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : l.winRate >= 30
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                      )}
                    >
                      {formatPercent(l.winRate)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                    {l.wonValue > 0 ? formatCurrency(l.wonValue, 'USD') : '-'}
                  </td>
                </tr>
              ))}
              {!loading && lanes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                    Bu dönem için güzergah verisi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Origin & Destination & Incoterm */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="En Çok Çıkış Ülkeleri" icon="flight_takeoff" loading={loading} empty={!loading && originItems.length === 0}>
          <RankingList items={originItems} max={10} />
        </ChartCard>
        <ChartCard title="En Çok Varış Ülkeleri" icon="flight_land" loading={loading} empty={!loading && destItems.length === 0}>
          <RankingList items={destItems} max={10} />
        </ChartCard>
        <ChartCard title="Incoterm Dağılımı" icon="gavel" loading={loading} empty={!loading && incoItems.length === 0}>
          <RankingList items={incoItems} max={10} />
        </ChartCard>
      </div>
    </div>
  );
}
