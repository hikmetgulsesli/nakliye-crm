'use client';

import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Award,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { AdminDashboardMetrics } from '@/types';

interface AdminMetricsCardsProps {
  metrics: AdminDashboardMetrics | null;
  loading: boolean;
}

interface MetricConfig {
  key: keyof AdminDashboardMetrics;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage';
}

const PRIMARY_METRICS: MetricConfig[] = [
  {
    key: 'totalQuotes',
    title: 'Toplam Teklif',
    subtitle: 'Dönem içinde',
    icon: <FileText className="w-5 h-5" />,
    color: 'blue',
    format: 'number',
  },
  {
    key: 'winRate',
    title: 'Kazanma Oranı',
    subtitle: 'Tüm teklifler',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'emerald',
    suffix: '%',
    format: 'percentage',
  },
  {
    key: 'activeCustomers',
    title: 'Aktif Müşteri',
    subtitle: 'Güncel durum',
    icon: <Users className="w-5 h-5" />,
    color: 'indigo',
    format: 'number',
  },
  {
    key: 'highPotentialCustomers',
    title: 'Yüksek Potansiyel',
    subtitle: 'Müşteri sayısı',
    icon: <Award className="w-5 h-5" />,
    color: 'amber',
    format: 'number',
  },
];

const SECONDARY_METRICS: MetricConfig[] = [
  {
    key: 'totalRevenue',
    title: 'Toplam Gelir',
    subtitle: 'Kazanılan teklifler',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'green',
    prefix: '$',
    format: 'currency',
  },
  {
    key: 'pendingQuotes',
    title: 'Bekleyen Teklif',
    subtitle: 'Cevap bekleniyor',
    icon: <Clock className="w-4 h-4" />,
    color: 'orange',
    format: 'number',
  },
  {
    key: 'lostQuotes',
    title: 'Kaybedilen Teklif',
    subtitle: 'Dönem içinde',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'red',
    format: 'number',
  },
];

function formatValue(value: number, format?: string, prefix?: string, suffix?: string): string {
  let formatted = '';
  
  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('tr-TR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
      break;
    case 'percentage':
      formatted = value.toFixed(1);
      break;
    case 'number':
    default:
      formatted = new Intl.NumberFormat('tr-TR').format(value);
      break;
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
}

export function AdminMetricsCards({ metrics, loading }: AdminMetricsCardsProps) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRIMARY_METRICS.map((config) => (
            <div key={config.key} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SECONDARY_METRICS.map((config) => (
            <div key={config.key} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>Metrikler yüklenemedi</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRIMARY_METRICS.map((config) => {
          const colors = getColorClasses(config.color);
          const value = metrics[config.key] as number;
          return (
            <div
              key={config.key}
              className={`rounded-xl border ${colors.border} bg-white p-6 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{config.title}</p>
                  <h3 className={`text-3xl font-bold ${colors.text} mt-2`}>
                    {formatValue(value, config.format, config.prefix, config.suffix)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{config.subtitle}</p>
                </div>
                <div className={`p-3 ${colors.bg} rounded-lg`}>
                  <div className={colors.text}>{config.icon}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {SECONDARY_METRICS.map((config) => {
          const colors = getColorClasses(config.color);
          const value = metrics[config.key] as number;
          return (
            <div
              key={config.key}
              className={`rounded-xl border ${colors.border} bg-white p-4 shadow-sm`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 ${colors.bg} rounded-lg`}>
                  <div className={colors.text}>{config.icon}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{config.title}</p>
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {formatValue(value, config.format, config.prefix, config.suffix)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
