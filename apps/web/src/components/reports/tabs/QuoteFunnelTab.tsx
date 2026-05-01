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
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { RankingList } from '../RankingList';
import { analyticsService, type AnalyticsFilters, type QuoteFunnelData } from '@/services/analytics.service';
import { formatNumber, formatPercent, formatCurrency } from '../formatters';
import { cn } from '@/utils/cn';

interface QuoteFunnelTabProps {
  filters: AnalyticsFilters;
}

export function QuoteFunnelTab({ filters }: QuoteFunnelTabProps) {
  const [data, setData] = useState<QuoteFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getQuoteFunnel(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Teklif hunisi verileri yüklenemedi.');
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

  const m = data?.metrics;
  const funnel = data?.funnel ?? [];
  const maxFunnel = Math.max(1, ...funnel.map((s) => s.count));

  const lossReasons = data?.lossReasons ?? [];
  const lossRanking = lossReasons.map((r) => ({
    label: r.reason,
    primary: `${formatNumber(r.count)} · ${formatPercent(r.percentage)}`,
    hint: r.value > 0 ? `${formatNumber(r.value)} kayıp` : undefined,
    percentage: r.percentage,
    barColor: 'bg-rose-500',
  }));

  return (
    <div className="space-y-6">
      {/* Metrik kartlari */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPICard
          icon="description"
          label="Toplam Teklif"
          value={loading ? '…' : formatNumber(m?.total ?? 0)}
          tone="blue"
        />
        <KPICard
          icon="emoji_events"
          label="Kazanma Oranı"
          value={loading ? '…' : formatPercent(m?.winRate ?? 0)}
          tone="emerald"
        />
        <KPICard
          icon="cancel"
          label="Kaybetme Oranı"
          value={loading ? '…' : formatPercent(m?.lossRate ?? 0)}
          tone="rose"
        />
        <KPICard
          icon="schedule"
          label="Ort. Kazanma Süresi"
          value={loading ? '…' : `${m?.avgCycleDays ?? 0} gün`}
          tone="amber"
        />
        <KPICard
          icon="history"
          label="Ort. Revizyon"
          value={loading ? '…' : (m?.avgRevisions ?? 0).toString()}
          tone="violet"
        />
        <KPICard
          icon="payments"
          label="Ortalama Kazanılan"
          value={
            loading
              ? '…'
              : (m?.avgWonValue ?? []).length > 0
                ? formatCurrency(m!.avgWonValue[0].avg, m!.avgWonValue[0].currency)
                : '—'
          }
          hint={
            (m?.avgWonValue ?? []).length > 1
              ? m!.avgWonValue.slice(1).map((v) => formatCurrency(v.avg, v.currency)).join(' · ')
              : undefined
          }
          tone="indigo"
        />
      </div>

      {/* Funnel + Status pie */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Teklif Hunisi"
          subtitle="Aşamalar arasında akış"
          icon="filter_alt"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && funnel.every((f) => f.count === 0)}
        >
          <div className="space-y-3 py-2">
            {funnel.map((stage, idx) => {
              const widthPct = Math.max(8, (stage.count / maxFunnel) * 100);
              const conversion =
                idx === 0 || funnel[idx - 1].count === 0
                  ? null
                  : Math.round((stage.count / funnel[idx - 1].count) * 100);
              return (
                <div key={stage.stage} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stage.stage}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-12 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <div
                        className="flex h-full items-center justify-between rounded-xl px-4 text-sm font-bold text-white shadow-sm transition-all"
                        style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                      >
                        <span className="tabular-nums">{formatNumber(stage.count)}</span>
                        {conversion !== null && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                            %{conversion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard
          title="Durum Dağılımı"
          subtitle="Yüzdelik kırılım"
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
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(data?.statusDistribution ?? []).map((s) => (
                    <Cell key={s.status} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(value, _name, props) => {
                    const pct = (props?.payload as { percentage?: number })?.percentage ?? 0;
                    return [`${formatNumber(Number(value))} (%${pct})`, 'Adet'];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Kayip nedenleri + bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Kayıp Nedenleri"
          subtitle="Kaybedilen tekliflerin neden bazlı dağılımı"
          icon="report_problem"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && lossReasons.length === 0}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lossReasons}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="reason"
                  type="category"
                  width={140}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(value) => [formatNumber(Number(value)), 'Adet']}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="En Sık Kayıp Nedenleri"
          subtitle="Sıralı liste"
          icon="format_list_numbered"
          loading={loading}
          empty={!loading && lossReasons.length === 0}
        >
          <RankingList items={lossRanking} max={6} />
        </ChartCard>
      </div>

      {/* Ortalama deger - currency basina */}
      {!loading && (m?.avgWonValue ?? []).length > 0 && (
        <ChartCard
          title="Para Birimi Bazında Kazanılan"
          subtitle="Toplam ve ortalama kazanılan teklif değeri"
          icon="account_balance_wallet"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {m!.avgWonValue.map((v) => (
              <div
                key={v.currency}
                className={cn(
                  'rounded-xl border p-4',
                  'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
                  'dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900',
                )}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {v.currency}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatCurrency(v.total, v.currency)}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatNumber(v.count)} teklif · ortalama {formatCurrency(v.avg, v.currency)}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
