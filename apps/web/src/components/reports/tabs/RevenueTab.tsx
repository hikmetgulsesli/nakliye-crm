import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { analyticsService, type AnalyticsFilters, type RevenueTrendData } from '@/services/analytics.service';
import { formatNumber, formatCurrency, formatMonthShort } from '../formatters';

interface RevenueTabProps {
  filters: AnalyticsFilters;
}

const CURRENCY_COLORS: Record<string, string> = {
  USD: '#10b981',
  EUR: '#3b82f6',
  TRY: '#f59e0b',
  GBP: '#8b5cf6',
  CNY: '#ef4444',
};

export function RevenueTab({ filters }: RevenueTabProps) {
  const [data, setData] = useState<RevenueTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getRevenueTrend(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Gelir verileri yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const series = useMemo(() => {
    if (!data) return [];
    return data.series.map((s) => ({
      ...s,
      monthLabel: formatMonthShort(String(s.month)),
    }));
  }, [data]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const currencies = data?.currencies ?? [];
  const totals = data?.totals ?? {};
  const totalsList = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Para birimi basina kartlar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <KPICard
          icon="emoji_events"
          label="Kazanılan Teklif"
          value={loading ? '…' : formatNumber(data?.wonCount ?? 0)}
          tone="emerald"
        />
        {totalsList.slice(0, 3).map(([cur, val]) => (
          <KPICard
            key={cur}
            icon="payments"
            label={`Toplam ${cur}`}
            value={loading ? '…' : formatCurrency(val, cur)}
            tone={cur === 'USD' ? 'emerald' : cur === 'EUR' ? 'blue' : 'amber'}
          />
        ))}
      </div>

      {/* Aylik gelir trendi (composed chart - currency basina) */}
      <ChartCard
        title="Aylık Gelir Trendi"
        subtitle="Para birimi bazında kazanılan teklif değeri"
        icon="show_chart"
        loading={loading}
        empty={!loading && (data?.wonCount ?? 0) === 0}
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {currencies.map((cur) => (
                  <linearGradient key={cur} id={`grad-${cur}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CURRENCY_COLORS[cur] ?? '#94a3b8'} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CURRENCY_COLORS[cur] ?? '#94a3b8'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return v.toString();
                }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                formatter={(value, name) => [formatCurrency(Number(value), name as string), name as string]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {currencies.map((cur) => (
                <Area
                  key={cur}
                  type="monotone"
                  dataKey={cur}
                  name={cur}
                  stroke={CURRENCY_COLORS[cur] ?? '#94a3b8'}
                  fill={`url(#grad-${cur})`}
                  strokeWidth={2}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Currency basina aylik bar */}
      {currencies.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {currencies.map((cur) => (
            <ChartCard
              key={cur}
              title={`${cur} Aylık Dağılımı`}
              icon="bar_chart"
              loading={loading}
              empty={
                !loading && series.every((s) => Number(s[cur as keyof typeof s] ?? 0) === 0)
              }
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                        return v.toString();
                      }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                      formatter={(value) => [formatCurrency(Number(value), cur), cur]}
                    />
                    <Bar
                      dataKey={cur}
                      fill={CURRENCY_COLORS[cur] ?? '#94a3b8'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          ))}
        </div>
      )}
    </div>
  );
}
