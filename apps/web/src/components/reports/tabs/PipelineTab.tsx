import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { analyticsService, type AnalyticsFilters, type PipelineData } from '@/services/analytics.service';
import { formatNumber, formatCurrency, formatMultiCurrency } from '../formatters';
import { cn } from '@/utils/cn';

interface PipelineTabProps {
  filters: AnalyticsFilters;
}

export function PipelineTab({ filters }: PipelineTabProps) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getPipeline(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Pipeline verileri yüklenemedi.');
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

  const summary = data?.summary;
  const buckets = data?.ageBuckets ?? [];
  const oldest = data?.oldest ?? [];
  const byUser = data?.byUser ?? [];

  const expectedValueEntries = Object.entries(summary?.expectedValue ?? {}).filter(([, v]) => v > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
        <span className="font-semibold">Bilgi:</span> Pipeline tarih filtresinden bağımsız olarak <strong>tüm aktif (Bekliyor)</strong> teklifleri gösterir. Sadece temsilci, mod ve para birimi filtreleri uygulanır.
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="hourglass_top"
          label="Aktif Teklif"
          value={loading ? '…' : formatNumber(summary?.total ?? 0)}
          tone="blue"
        />
        <KPICard
          icon="schedule"
          label="Ortalama Yaş"
          value={loading ? '…' : `${summary?.avgAgeDays ?? 0} gün`}
          tone="amber"
        />
        <KPICard
          icon="event_busy"
          label="Vadesi Geçmiş"
          value={loading ? '…' : formatNumber(summary?.expired ?? 0)}
          tone="rose"
          hint="Bekleyen + validity < bugün"
        />
        <KPICard
          icon="payments"
          label="Beklenen Değer"
          value={
            loading
              ? '…'
              : expectedValueEntries.length > 0
                ? formatCurrency(expectedValueEntries[0][1], expectedValueEntries[0][0])
                : '—'
          }
          hint={
            expectedValueEntries.length > 1
              ? expectedValueEntries
                  .slice(1)
                  .map(([cur, v]) => formatCurrency(v, cur))
                  .join(' · ')
              : undefined
          }
          tone="emerald"
        />
      </div>

      {/* Yas kovalari */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Yaş Dağılımı"
          subtitle="Bekleyen tekliflerin teklif tarihinden bu yana geçen süre"
          icon="bar_chart"
          className="lg:col-span-2"
          loading={loading}
          empty={!loading && buckets.every((b) => b.count === 0)}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Teklif']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {buckets.map((b) => (
                    <Cell key={b.key} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Kova Detayı"
          icon="format_list_bulleted"
          loading={loading}
          empty={!loading && buckets.every((b) => b.count === 0)}
        >
          <ul className="space-y-3">
            {buckets.map((b) => (
              <li
                key={b.key}
                className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <span className="size-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(b.count)}
                  </span>
                </div>
                {Object.keys(b.value).length > 0 && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatMultiCurrency(b.value)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Temsilci basina pipeline */}
      <ChartCard
        title="Temsilci Bazında Pipeline"
        subtitle="Her temsilcinin elindeki aktif teklifler"
        icon="groups"
        loading={loading}
        empty={!loading && byUser.length === 0}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Temsilci</th>
                <th className="px-5 py-3 text-right font-semibold">Aktif Teklif</th>
                <th className="px-5 py-3 text-right font-semibold">Beklenen Değer</th>
                <th className="px-5 py-3 text-right font-semibold">Ort. Yaş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {byUser.map((u) => (
                <tr key={u.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {u.fullName}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatNumber(u.count)}</td>
                  <td className="px-5 py-3 text-right text-xs text-slate-700 dark:text-slate-300">
                    {formatMultiCurrency(u.value)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        u.avgAgeDays <= 7
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : u.avgAgeDays <= 14
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            : u.avgAgeDays <= 30
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                      )}
                    >
                      {u.avgAgeDays} gün
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* En yasli bekleyen teklifler */}
      <ChartCard
        title="Aksiyon Bekleyen Teklifler"
        subtitle="En uzun süredir bekleyen / vadesi yaklaşan teklifler"
        icon="warning"
        loading={loading}
        empty={!loading && oldest.length === 0}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Teklif</th>
                <th className="px-5 py-3 text-left font-semibold">Müşteri</th>
                <th className="px-5 py-3 text-left font-semibold">Temsilci</th>
                <th className="px-5 py-3 text-right font-semibold">Yaş</th>
                <th className="px-5 py-3 text-right font-semibold">Tutar</th>
                <th className="px-5 py-3 text-right font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {oldest.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <Link
                      to={`/teklifler/${q.id}`}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {q.quoteNo}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {q.customerName}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {q.assignedUserName}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        q.ageDays <= 7
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : q.ageDays <= 14
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            : q.ageDays <= 30
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                      )}
                    >
                      {q.ageDays} gün
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {q.price > 0 ? formatCurrency(q.price, q.currency) : '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {q.isExpired ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                        Vadesi geçti
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Aktif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
