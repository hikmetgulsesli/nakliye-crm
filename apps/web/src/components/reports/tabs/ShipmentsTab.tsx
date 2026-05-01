import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChartCard } from '../ChartCard';
import { KPICard } from '../KPICard';
import { analyticsService, type AnalyticsFilters, type ShipmentsData } from '@/services/analytics.service';
import { formatNumber, formatMonthShort } from '../formatters';
import { cn } from '@/utils/cn';

interface ShipmentsTabProps {
  filters: AnalyticsFilters;
}

const STATUS_COLORS: Record<string, string> = {
  booked: '#3b82f6',
  in_transit: '#f59e0b',
  delivered: '#10b981',
  completed: '#10b981',
  cancelled: '#94a3b8',
  customs: '#8b5cf6',
  unknown: '#cbd5e1',
};

const STATUS_LABELS: Record<string, string> = {
  booked: 'Rezervasyon',
  in_transit: 'Yolda',
  delivered: 'Teslim Edildi',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  customs: 'Gümrükte',
  unknown: 'Bilinmiyor',
};

const MODE_COLORS: Record<string, string> = {
  Deniz: '#3b82f6',
  Kara: '#10b981',
  Hava: '#f59e0b',
  Demiryolu: '#94a3b8',
  Kombine: '#8b5cf6',
  Belirtilmemis: '#cbd5e1',
};

function formatDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ShipmentsTab({ filters }: ShipmentsTabProps) {
  const [data, setData] = useState<ShipmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsService
      .getShipments(filters)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Sevkiyat verileri yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const monthlyTrend = useMemo(
    () =>
      (data?.monthlyTrend ?? []).map((m) => ({
        ...m,
        monthLabel: formatMonthShort(m.month),
      })),
    [data],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const summary = data?.summary;
  const statusDist = (data?.statusDistribution ?? []).map((s) => ({
    ...s,
    label: STATUS_LABELS[s.status] ?? s.status,
    color: STATUS_COLORS[s.status] ?? '#94a3b8',
  }));
  const modes = data?.transportModes ?? [];
  const delayed = data?.delayed ?? [];
  const upcoming = data?.upcoming ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPICard
          icon="local_shipping"
          label="Toplam Sevkiyat"
          value={loading ? '…' : formatNumber(summary?.total ?? 0)}
          tone="blue"
        />
        <KPICard
          icon="play_circle"
          label="Aktif"
          value={loading ? '…' : formatNumber(summary?.active ?? 0)}
          tone="amber"
        />
        <KPICard
          icon="check_circle"
          label="Tamamlanan"
          value={loading ? '…' : formatNumber(summary?.completed ?? 0)}
          tone="emerald"
        />
        <KPICard
          icon="warning"
          label="Gecikmeli"
          value={loading ? '…' : formatNumber(summary?.delayed ?? 0)}
          hint="ETA geçti, hala aktif"
          tone="rose"
        />
      </div>

      {/* Status + Mode + Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Durum Dağılımı"
          icon="donut_small"
          loading={loading}
          empty={!loading && statusDist.length === 0}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusDist.map((s) => (
                    <Cell key={s.status} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Sevkiyat']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Taşıma Modu"
          icon="local_shipping"
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
                  formatter={(v, name) => [`${formatNumber(Number(v))} sevkiyat`, name as string]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Aylık Sevkiyat Trendi"
          icon="show_chart"
          loading={loading}
          empty={!loading && monthlyTrend.every((m) => m.count === 0)}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="shipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
                  formatter={(v) => [formatNumber(Number(v)), 'Sevkiyat']}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#shipGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Gecikmeli sevkiyatlar */}
      <ChartCard
        title="Gecikmeli Sevkiyatlar"
        subtitle="ETA tarihi geçmiş aktif sevkiyatlar"
        icon="schedule"
        loading={loading}
        empty={!loading && delayed.length === 0}
        emptyText="Gecikmeli sevkiyat yok — harika!"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Sevkiyat No</th>
                <th className="px-5 py-3 text-left font-semibold">Müşteri</th>
                <th className="px-5 py-3 text-left font-semibold">Güzergah</th>
                <th className="px-5 py-3 text-left font-semibold">Mod</th>
                <th className="px-5 py-3 text-right font-semibold">ETA</th>
                <th className="px-5 py-3 text-right font-semibold">Gecikme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {delayed.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <Link
                      to={`/sevkiyatlar/${s.id}`}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {s.shipmentNo}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {s.customerName}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {s.origin || '-'} <span className="mx-1 text-slate-400">→</span> {s.destination || '-'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {s.transportMode || '-'}
                  </td>
                  <td className="px-5 py-3 text-right text-xs">{formatDate(s.eta)}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        s.delayDays <= 3
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : s.delayDays <= 7
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                            : 'bg-rose-200 text-rose-800 dark:bg-rose-500/30 dark:text-rose-200',
                      )}
                    >
                      {s.delayDays} gün
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Yaklasan teslimatlar */}
      <ChartCard
        title="Yaklaşan Teslimatlar"
        subtitle="Önümüzdeki 14 gün içinde teslim edilecek sevkiyatlar"
        icon="event_available"
        loading={loading}
        empty={!loading && upcoming.length === 0}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Sevkiyat No</th>
                <th className="px-5 py-3 text-left font-semibold">Müşteri</th>
                <th className="px-5 py-3 text-left font-semibold">Güzergah</th>
                <th className="px-5 py-3 text-left font-semibold">Mod</th>
                <th className="px-5 py-3 text-right font-semibold">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <Link
                      to={`/sevkiyatlar/${s.id}`}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {s.shipmentNo}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {s.customerName}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {s.origin || '-'} <span className="mx-1 text-slate-400">→</span> {s.destination || '-'}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {s.transportMode || '-'}
                  </td>
                  <td className="px-5 py-3 text-right text-xs font-medium">
                    {formatDate(s.eta)}
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
