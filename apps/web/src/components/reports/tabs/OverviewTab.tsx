import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { KPICard } from '../KPICard';
import { ChartCard } from '../ChartCard';
import { analyticsService, type AnalyticsFilters, type OverviewData } from '@/services/analytics.service';
import { formatNumber, formatPercent, formatMonthShort, formatCurrency } from '../formatters';

const STATUS_COLORS: Record<string, string> = {
  Kazanıldı: '#10b981',
  Kaybedildi: '#ef4444',
  Bekliyor: '#3b82f6',
  İptal: '#94a3b8',
};

interface OverviewTabProps {
  filters: AnalyticsFilters;
}

export function OverviewTab({ filters }: OverviewTabProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getOverview(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Genel bakış verileri yüklenemedi.');
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

  const k = data?.kpis;
  const wonValueEntries = Object.entries(k?.wonValueByCurrency ?? {}).filter(([, v]) => v > 0);
  const monthlyChartData = (data?.monthlyTrend ?? []).map((m) => ({
    ...m,
    monthLabel: formatMonthShort(m.month),
  }));

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KPICard
          icon="description"
          label="Verilen Teklif"
          value={loading ? '…' : formatNumber(k?.totalQuotes.value ?? 0)}
          trend={k?.totalQuotes.trend}
          tone="blue"
          href="/teklifler"
        />
        <KPICard
          icon="emoji_events"
          label="Kazanılan"
          value={loading ? '…' : formatNumber(k?.wonQuotes.value ?? 0)}
          trend={k?.wonQuotes.trend}
          tone="emerald"
          href="/teklifler?status=Kazanıldı"
        />
        <KPICard
          icon="cancel"
          label="Kaybedilen"
          value={loading ? '…' : formatNumber(k?.lostQuotes.value ?? 0)}
          trend={k?.lostQuotes.trend}
          tone="rose"
          href="/teklifler?status=Kaybedildi"
        />
        <KPICard
          icon="hourglass_top"
          label="Bekleyen"
          value={loading ? '…' : formatNumber(k?.pendingQuotes.value ?? 0)}
          tone="amber"
          href="/teklifler?status=Bekliyor"
        />
        <KPICard
          icon="track_changes"
          label="Kazanma Oranı"
          value={loading ? '…' : formatPercent(k?.winRate.value ?? 0)}
          trend={k?.winRate.trend}
          tone="violet"
        />
        <KPICard
          icon="person_add"
          label="Yeni Müşteri"
          value={loading ? '…' : formatNumber(k?.newCustomers.value ?? 0)}
          trend={k?.newCustomers.trend}
          hint={`${formatNumber(k?.activeCustomers.value ?? 0)} aktif`}
          tone="indigo"
          href="/musteriler"
        />
      </div>

      {/* Kazanilan deger - currency basina */}
      {wonValueEntries.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-300">payments</span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Kazanılan Teklif Değeri
            </h3>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {wonValueEntries.map(([currency, value]) => (
              <div key={currency}>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatCurrency(value, currency)}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Toplam {currency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend ve durum */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Aylık Teklif Trendi"
          subtitle="Verilen, kazanılan ve kaybedilen teklif sayıları"
          icon="show_chart"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && monthlyChartData.length === 0}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  labelFormatter={(label) => `Ay: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="total" name="Verilen" stroke="#6366f1" fill="url(#totalGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="won" name="Kazanılan" stroke="#10b981" fill="url(#wonGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="lost" name="Kaybedilen" stroke="#ef4444" fill="url(#lostGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Durum Dağılımı"
          subtitle="Tüm tekliflerin durum bazlı dağılımı"
          icon="donut_small"
          loading={loading}
          empty={!loading && (data?.statusDistribution ?? []).every((s) => s.count === 0)}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusDistribution ?? []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(data?.statusDistribution ?? []).map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(value) => [formatNumber(Number(value)), 'Adet']}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry) => {
                    const count = (entry?.payload as { count?: number })?.count ?? 0;
                    return `${value} · ${count}`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Aylik kazanma yuzdesi */}
      <ChartCard
        title="Aylık Kazanma Oranı"
        subtitle="Sonuçlanan tekliflerin (kazanılan + kaybedilen) içindeki kazanma yüzdesi"
        icon="trending_up"
        loading={loading}
        empty={!loading && monthlyChartData.length === 0}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `%${v}`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                formatter={(value) => [`%${Number(value)}`, 'Kazanma']}
              />
              <Bar dataKey="winRate" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
