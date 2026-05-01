import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { RankingList } from '../RankingList';
import {
  analyticsService,
  type AnalyticsFilters,
  type CustomerSegmentsData,
  type TopCustomersData,
} from '@/services/analytics.service';
import { formatNumber, formatPercent, formatMultiCurrency } from '../formatters';

interface CustomersTabProps {
  filters: AnalyticsFilters;
}

const POTENTIAL_COLORS: Record<string, string> = {
  Yüksek: '#10b981',
  Orta: '#f59e0b',
  Düşük: '#94a3b8',
  Belirtilmemis: '#cbd5e1',
};

export function CustomersTab({ filters }: CustomersTabProps) {
  const [segments, setSegments] = useState<CustomerSegmentsData | null>(null);
  const [top, setTop] = useState<TopCustomersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsService.getCustomerSegments(filters),
      analyticsService.getTopCustomers(filters),
    ])
      .then(([s, t]) => {
        if (cancelled) return;
        setSegments(s);
        setTop(t);
      })
      .catch(() => {
        if (!cancelled) setError('Müşteri analizi verileri yüklenemedi.');
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

  const potentialMaxValue = segments
    ? Math.max(1, ...segments.byPotential.map((p) => p.count))
    : 1;
  const sourceMaxValue = segments ? Math.max(1, ...segments.bySource.map((p) => p.count)) : 1;

  const sourceItems =
    segments?.bySource.map((s) => ({
      label: s.key,
      primary: formatNumber(s.count),
      percentage: Math.round((s.count / sourceMaxValue) * 100),
      barColor: 'bg-indigo-500',
    })) ?? [];

  const directionItems =
    segments?.byDirection.map((s) => ({
      label: s.key,
      primary: formatNumber(s.count),
      percentage:
        segments.byDirection.length > 0
          ? Math.round(
              (s.count / Math.max(1, ...segments.byDirection.map((x) => x.count))) * 100,
            )
          : 0,
      barColor: 'bg-violet-500',
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="groups"
          label="Toplam Müşteri"
          value={loading ? '…' : formatNumber(segments?.total ?? 0)}
          tone="indigo"
        />
        <KPICard
          icon="person_add"
          label="Bu Dönem Yeni"
          value={loading ? '…' : formatNumber(segments?.newInPeriod ?? 0)}
          tone="emerald"
        />
        <KPICard
          icon="star"
          label="Yüksek Potansiyel"
          value={
            loading
              ? '…'
              : formatNumber(
                  segments?.byPotential.find((p) => p.key === 'Yüksek')?.count ?? 0,
                )
          }
          tone="amber"
        />
        <KPICard
          icon="warning"
          label="Yüksek Risk (Churn)"
          value={
            loading
              ? '…'
              : formatNumber(
                  (segments?.churnDistribution.find((c) => c.key === 'high')?.count ?? 0) +
                    (segments?.churnDistribution.find((c) => c.key === 'critical')?.count ?? 0),
                )
          }
          tone="rose"
        />
      </div>

      {/* Potential + ChurnRisk + ContactBuckets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Potansiyel Dağılımı"
          icon="rocket_launch"
          loading={loading}
          empty={!loading && (segments?.byPotential ?? []).length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments?.byPotential ?? []}
                  dataKey="count"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(segments?.byPotential ?? []).map((p) => (
                    <Cell key={p.key} fill={POTENTIAL_COLORS[p.key] ?? '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Müşteri']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Churn Risk"
          subtitle="Müşteri kaybetme riski seviyeleri"
          icon="health_and_safety"
          loading={loading}
          empty={!loading && (segments?.churnDistribution ?? []).every((c) => c.count === 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments?.churnDistribution ?? []}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(segments?.churnDistribution ?? []).map((c) => (
                    <Cell key={c.key} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Müşteri']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Son İletişim"
          subtitle="Müşterilerin son temas süreleri"
          icon="schedule"
          loading={loading}
          empty={!loading && (segments?.contactBuckets ?? []).every((c) => c.count === 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments?.contactBuckets ?? []} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Müşteri']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(segments?.contactBuckets ?? []).map((c) => (
                    <Cell key={c.key} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Source + Direction */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Müşteri Kaynakları"
          subtitle="Hangi kanaldan geldikleri"
          icon="hub"
          loading={loading}
          empty={!loading && sourceItems.length === 0}
        >
          <RankingList items={sourceItems} max={8} />
        </ChartCard>

        <ChartCard
          title="Yön Dağılımı"
          subtitle="İhracat / İthalat / Transit"
          icon="compare_arrows"
          loading={loading}
          empty={!loading && directionItems.length === 0}
        >
          <RankingList items={directionItems} max={6} />
        </ChartCard>
      </div>

      {/* En degerli musteriler */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="En Çok Teklif Verilen"
          subtitle="Teklif sayısına göre"
          icon="receipt_long"
          loading={loading}
          empty={!loading && (top?.byQuoteCount ?? []).length === 0}
        >
          <ul className="space-y-2 text-sm">
            {(top?.byQuoteCount ?? []).slice(0, 8).map((c, idx) => (
              <li
                key={c.customerId}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <Link
                    to={`/musteriler/${c.customerId}`}
                    className="truncate font-medium text-slate-800 hover:text-primary dark:text-slate-200"
                  >
                    {c.companyName}
                  </Link>
                </span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatNumber(c.quoteCount)}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="En Çok Kazanılan"
          subtitle="Kazanılan teklif sayısına göre"
          icon="emoji_events"
          loading={loading}
          empty={!loading && (top?.byWonCount ?? []).length === 0}
        >
          <ul className="space-y-2 text-sm">
            {(top?.byWonCount ?? []).slice(0, 8).map((c, idx) => (
              <li
                key={c.customerId}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-emerald-100 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {idx + 1}
                  </span>
                  <Link
                    to={`/musteriler/${c.customerId}`}
                    className="truncate font-medium text-slate-800 hover:text-primary dark:text-slate-200"
                  >
                    {c.companyName}
                  </Link>
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                  {formatNumber(c.wonCount)} · {formatPercent(c.winRate)}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="En Yüksek Gelir"
          subtitle="Kazanılan toplam değer"
          icon="payments"
          loading={loading}
          empty={!loading && (top?.byValue ?? []).length === 0}
        >
          <ul className="space-y-2 text-sm">
            {(top?.byValue ?? []).slice(0, 8).map((c, idx) => (
              <li
                key={c.customerId}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-5 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                    {idx + 1}
                  </span>
                  <Link
                    to={`/musteriler/${c.customerId}`}
                    className="truncate font-medium text-slate-800 hover:text-primary dark:text-slate-200"
                  >
                    {c.companyName}
                  </Link>
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {formatMultiCurrency(c.wonValue)}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Ek bar chart: potansiyel */}
      <ChartCard
        title="Potansiyel Bazında Müşteri Sayısı"
        icon="bar_chart"
        loading={loading}
        empty={!loading && (segments?.byPotential ?? []).length === 0}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segments?.byPotential ?? []} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="key" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                formatter={(v) => [formatNumber(Number(v)), 'Müşteri']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {(segments?.byPotential ?? []).map((p) => (
                  <Cell
                    key={p.key}
                    fill={POTENTIAL_COLORS[p.key] ?? '#94a3b8'}
                    fillOpacity={Math.max(0.4, p.count / potentialMaxValue)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
