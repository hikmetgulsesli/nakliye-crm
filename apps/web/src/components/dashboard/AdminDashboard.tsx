import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';
import { KPICard } from '@/components/shared/KPICard';
import { TeamPerformanceTable } from './TeamPerformanceTable';
import { CountryDensityChart } from './CountryDensityChart';
import { TransportModeChart } from './TransportModeChart';
import { LossReasonsChart } from './LossReasonsChart';
import { dashboardService, type AdminDashboardData } from '@/services/dashboard.service';

const PERIOD_TABS = [
  { key: 'this_week', label: 'Bu Hafta' },
  { key: 'this_month', label: 'Bu Ay' },
  { key: 'last_month', label: 'Geçen Ay' },
];

function KPISkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="size-12 rounded-xl bg-slate-200" />
            <div className="h-5 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-pulse">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="h-5 w-64 rounded bg-slate-200" />
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/60 h-12" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="size-8 rounded-full bg-slate-200" />
          <div className="h-4 bg-slate-200 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded w-12" />
          <div className="h-4 bg-slate-200 rounded w-12" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-8 rounded bg-slate-200" />
              <div className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse">
          <div className="h-5 w-36 rounded bg-slate-200 mb-6" />
          <div className="h-32 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse">
          <div className="h-5 w-36 rounded bg-slate-200 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [activePeriod, setActivePeriod] = useState('this_month');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getAdminDashboard(activePeriod);
      setData(result);
    } catch (err) {
      setError('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      {/* Filter Tabs + Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePeriod(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activePeriod === tab.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-slate-100',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button icon="add" onClick={() => navigate('/teklifler/yeni')}>
          Yeni Teklif Oluştur
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <Button variant="secondary" onClick={() => { setData(null); setError(null); fetchData(); }}>
            Tekrar Dene
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <>
          <KPISkeletons />
          <TableSkeleton />
          <ChartsSkeleton />
        </>
      )}

      {/* Data State */}
      {!loading && !error && data && (
        <>
          {/* KPI Cards - 5 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.kpis.map((kpi, i) => (
              <KPICard
                key={i}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
                label={kpi.label}
                value={kpi.value}
                trend={kpi.trend}
              />
            ))}
          </div>

          {/* Team Performance Table */}
          <TeamPerformanceTable data={data.teamPerformance} />

          {/* Bottom Row: 2 column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Country Density */}
            <CountryDensityChart
              originCountries={data.originCountries}
              destinationCountries={data.destinationCountries}
            />

            {/* Right: Transport Mode + Loss Reasons stacked */}
            <div className="flex flex-col gap-8">
              <TransportModeChart data={data.transportModes} />
              <LossReasonsChart data={data.lossReasons} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
