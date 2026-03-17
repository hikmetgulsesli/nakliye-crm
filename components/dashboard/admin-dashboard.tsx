"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Globe,
  Truck,
  XCircle,
} from "lucide-react";
import { StatCard } from "./stat-card";
import type { AdminDashboardData } from "@/lib/dashboard";

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Error loading dashboard: {error || "Unknown error"}
      </div>
    );
  }

  const { 
    metrics, 
    personnelPerformance, 
    topOriginCountries, 
    topDestinationCountries,
    modeDistribution,
    lossReasonAnalysis 
  } = data;

  // Calculate trends
  const quoteTrend = metrics.quotesGivenThisMonth >= metrics.quotesGivenLastMonth ? "up" : "down";
  const quoteTrendValue = metrics.quotesGivenLastMonth > 0
    ? `${Math.abs(Math.round(((metrics.quotesGivenThisMonth - metrics.quotesGivenLastMonth) / metrics.quotesGivenLastMonth) * 100))}%`
    : "N/A";

  return (
    <div className="space-y-6">
      {/* General Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Quotes This Month"
          value={metrics.quotesGivenThisMonth}
          subtitle={`vs ${metrics.quotesGivenLastMonth} last month`}
          trend={quoteTrend as "up" | "down"}
          trendValue={quoteTrendValue}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Quotes Won"
          value={metrics.quotesWonThisMonth}
          subtitle={`${metrics.winRateThisMonth}% win rate`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Active Customers"
          value={metrics.activeCustomerCount}
          subtitle={`${metrics.highPotentialCustomerCount} high potential`}
          icon={<Users className="h-6 w-6" />}
          color="amber"
        />
        <StatCard
          title="Win Rate"
          value={`${metrics.winRateThisMonth}%`}
          subtitle="This month"
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Personnel Performance Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Personnel Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                  Representative
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                  Quotes Given
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                  Won
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                  Win %
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                  Contacted
                </th>
              </tr>
            </thead>
            <tbody>
              {personnelPerformance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No data available
                  </td>
                </tr>
              ) : (
                personnelPerformance.map((person) => (
                  <tr 
                    key={person.id} 
                    className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {person.name}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                      {person.quotesGiven}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                      {person.quotesWon}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        person.winRate >= 50 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : person.winRate >= 30 
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}>
                        {person.winRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                      {person.customersContacted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts & Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Origin Countries */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Top Origin Countries
            </h3>
          </div>
          <div className="p-4">
            {topOriginCountries.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No data available</p>
            ) : (
              <ul className="space-y-3">
                {topOriginCountries.map((country) => (
                  <li key={country.country} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{country.country}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-blue-500"
                          style={{ 
                            width: `${topOriginCountries[0]?.quoteCount 
                              ? (country.quoteCount / topOriginCountries[0].quoteCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">
                        {country.quoteCount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top Destination Countries */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              Top Destination Countries
            </h3>
          </div>
          <div className="p-4">
            {topDestinationCountries.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No data available</p>
            ) : (
              <ul className="space-y-3">
                {topDestinationCountries.map((country) => (
                  <li key={country.country} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{country.country}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-500"
                          style={{ 
                            width: `${topDestinationCountries[0]?.quoteCount 
                              ? (country.quoteCount / topDestinationCountries[0].quoteCount) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">
                        {country.quoteCount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mode Distribution */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-500" />
              Transport Mode Distribution
            </h3>
          </div>
          <div className="p-4">
            {modeDistribution.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No data available</p>
            ) : (
              <ul className="space-y-3">
                {modeDistribution.map((mode) => (
                  <li key={mode.mode} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{mode.mode}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        Win: {mode.winRate}%
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-amber-500"
                            style={{ 
                              width: `${modeDistribution[0]?.quoteCount 
                                ? (mode.quoteCount / modeDistribution[0].quoteCount) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">
                          {mode.quoteCount}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Loss Reason Analysis */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              Loss Reason Analysis
            </h3>
          </div>
          <div className="p-4">
            {lossReasonAnalysis.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No lost quotes this month</p>
            ) : (
              <ul className="space-y-3">
                {lossReasonAnalysis.map((reason) => (
                  <li key={reason.reason} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{reason.reason}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        {reason.rate}%
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-rose-500"
                            style={{ 
                              width: `${lossReasonAnalysis[0]?.count 
                                ? (reason.count / lossReasonAnalysis[0].count) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white w-8 text-right">
                          {reason.count}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
