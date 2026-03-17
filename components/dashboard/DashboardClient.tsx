"use client";

import { RefreshCw } from "lucide-react";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { UserMetricsCards, TeamMetricsCards } from "./MetricCards";
import {
  UpcomingFollowUpsWidget,
  CustomersToCallWidget,
  PendingQuotesWidget,
  RecentActivitiesWidget,
} from "./Widgets";
import {
  PersonnelPerformanceTable,
  CountryDistribution,
  TransportModeDistribution,
  LossReasonAnalysis,
} from "./AdminDashboard";

interface DashboardClientProps {
  isAdmin: boolean;
}

export function DashboardClient({ isAdmin }: DashboardClientProps) {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-500 dark:text-slate-400">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500 dark:text-slate-400">Veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Metrics */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Kişisel Metrikler
        </h2>
        <UserMetricsCards metrics={data.user} />
      </section>

      {/* User Widgets */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Hızlı Bakış
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UpcomingFollowUpsWidget followUps={data.widgets.upcomingFollowUps} />
          <CustomersToCallWidget customers={data.widgets.customersToCall} />
          <PendingQuotesWidget quotes={data.widgets.pendingQuotes} />
          <RecentActivitiesWidget activities={data.widgets.recentActivities} />
        </div>
      </section>

      {/* Admin Dashboard */}
      {isAdmin && data.admin && (
        <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Ekip Performansı
          </h2>
          <div className="space-y-6">
            {/* Team Metrics */}
            <TeamMetricsCards metrics={data.admin.teamMetrics} />

            {/* Personnel Performance Table */}
            <PersonnelPerformanceTable personnel={data.admin.personnelPerformance} />

            {/* Country Distribution */}
            <CountryDistribution
              originCountries={data.admin.originCountries}
              destinationCountries={data.admin.destinationCountries}
            />

            {/* Transport Mode & Loss Reason */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TransportModeDistribution stats={data.admin.transportModeStats} />
              <LossReasonAnalysis reasons={data.admin.lossReasonAnalysis} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
