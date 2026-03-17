"use client";

import { TrendingUp, Users, FileText, Percent, Phone, Calendar } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{value}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              <TrendingUp className="w-4 h-4" />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-primary">{icon}</div>
      </div>
    </div>
  );
}

interface UserMetricsProps {
  metrics: {
    weeklyQuotes: number;
    monthlyQuotes: number;
    monthlyWon: number;
    monthlyWinRate: number;
    contactedCustomers: number;
  };
}

export function UserMetricsCards({ metrics }: UserMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Bu Hafta Teklif"
        value={metrics.weeklyQuotes}
        icon={<FileText className="w-5 h-5" />}
      />
      <MetricCard
        title="Bu Ay Teklif"
        value={metrics.monthlyQuotes}
        icon={<FileText className="w-5 h-5" />}
      />
      <MetricCard
        title="Bu Ay Kazanılan"
        value={metrics.monthlyWon}
        subtitle={`%${metrics.monthlyWinRate} başarı oranı`}
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <MetricCard
        title="Kazanma Oranı"
        value={`%${metrics.monthlyWinRate}`}
        icon={<Percent className="w-5 h-5" />}
      />
      <MetricCard
        title="Görüşülen Müşteri"
        value={metrics.contactedCustomers}
        subtitle="Bu ay"
        icon={<Users className="w-5 h-5" />}
      />
    </div>
  );
}

interface TeamMetricsProps {
  metrics: {
    weeklyQuotes: number;
    monthlyQuotes: number;
    lastMonthQuotes: number;
    monthlyWon: number;
    teamWinRate: number;
    activeCustomers: number;
    highPotentialCustomers: number;
  };
}

export function TeamMetricsCards({ metrics }: TeamMetricsProps) {
  const quoteChange = metrics.lastMonthQuotes > 0
    ? Math.round(((metrics.monthlyQuotes - metrics.lastMonthQuotes) / metrics.lastMonthQuotes) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Bu Hafta Teklif"
        value={metrics.weeklyQuotes}
        icon={<Calendar className="w-5 h-5" />}
      />
      <MetricCard
        title="Bu Ay Teklif"
        value={metrics.monthlyQuotes}
        subtitle={`Geçen aya göre %${Math.abs(quoteChange)} ${quoteChange >= 0 ? "artış" : "düşüş"}`}
        trend={{ value: Math.abs(quoteChange), isPositive: quoteChange >= 0 }}
        icon={<FileText className="w-5 h-5" />}
      />
      <MetricCard
        title="Kazanma Oranı"
        value={`%${metrics.teamWinRate}`}
        subtitle={`${metrics.monthlyWon} kazanılan teklif`}
        icon={<Percent className="w-5 h-5" />}
      />
      <MetricCard
        title="Aktif Müşteriler"
        value={metrics.activeCustomers}
        subtitle={`${metrics.highPotentialCustomers} yüksek potansiyel`}
        icon={<Users className="w-5 h-5" />}
      />
    </div>
  );
}
