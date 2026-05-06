import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { KPICard } from '@/components/shared/KPICard';
import { AlertWidgets } from './AlertWidgets';
import { FollowUpWidget } from './FollowUpWidget';
import { RecentActivitiesWidget } from './RecentActivitiesWidget';
import { DailyPlanWidget } from './DailyPlanWidget';
import { MyGoalsCard } from './MyGoalsCard';
import { LeaderboardWidget } from './LeaderboardWidget';
import { SmartQueueWidget } from './SmartQueueWidget';
import { FeatureGate } from '@/components/features/FeatureGate';
import { dashboardService, type UserDashboardData } from '@/services/dashboard.service';

function KPISkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="size-12 rounded-xl bg-slate-200" />
            <div className="h-5 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="h-8 w-14 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-6 w-8 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200 mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-32 rounded bg-slate-200 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="py-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserDashboard() {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getUserDashboard();
      setData(result);
    } catch (err) {
      setError('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Quick Log gibi aktivite tetikleyicileri sonrasi KPI'lari yenile.
    const onActivityLogged = () => fetchData();
    window.addEventListener('activity:logged', onActivityLogged);
    return () => window.removeEventListener('activity:logged', onActivityLogged);
  }, []);

  return (
    <div className="space-y-8">
      {/* Greeting DashboardPage'de uretiliyor — burada tekrar etmiyoruz */}

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
          <AlertsSkeleton />
          <ContentSkeleton />
        </>
      )}

      {/* Data State */}
      {!loading && !error && data && (
        <>
          {/* KPI Cards - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Daily Plan — bugün yapılacaklar */}
          <FeatureGate feature="daily_plan">
            <DailyPlanWidget />
          </FeatureGate>

          {/* AI Smart Queue */}
          <FeatureGate feature="smart_queue">
            <SmartQueueWidget />
          </FeatureGate>

          {/* Motivasyon satiri: hedefler + sıralama */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeatureGate feature="sales_goals">
              <MyGoalsCard />
            </FeatureGate>
            <FeatureGate feature="gamification">
              <LeaderboardWidget />
            </FeatureGate>
          </div>

          {/* Alert Widgets (2x2) */}
          <AlertWidgets alerts={data.alerts} />

          {/* Two column layout: Main content + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Recent Activities (takes 2 cols) */}
            <div className="lg:col-span-2">
              <RecentActivitiesWidget
                activities={data.recentActivities}
                showRepresentative
              />
            </div>

            {/* Right: Follow-ups sidebar */}
            <div>
              <FollowUpWidget followUps={data.followUps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
