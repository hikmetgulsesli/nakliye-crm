'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  Activity
} from 'lucide-react';
import type { UserDashboardMetrics } from '@/types';

interface UserMetricsCardsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface MetricConfig {
  key: keyof UserDashboardMetrics;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'quotesThisWeek',
    title: 'Bu Hafta Teklif',
    subtitle: 'Son 7 gün',
    icon: <FileText className="w-5 h-5" />,
    color: 'blue',
  },
  {
    key: 'quotesThisMonth',
    title: 'Bu Ay Teklif',
    subtitle: 'Aylık toplam',
    icon: <FileText className="w-5 h-5" />,
    color: 'indigo',
  },
  {
    key: 'winRateThisMonth',
    title: 'Kazanma Oranı',
    subtitle: 'Bu ay',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'emerald',
    suffix: '%',
  },
  {
    key: 'customersContactedThisMonth',
    title: 'Görüşülen Müşteri',
    subtitle: 'Bu ay',
    icon: <Users className="w-5 h-5" />,
    color: 'amber',
  },
];

const SECONDARY_METRICS: MetricConfig[] = [
  {
    key: 'pendingQuotes',
    title: 'Bekleyen Teklif',
    subtitle: 'Cevap bekleniyor',
    icon: <Clock className="w-4 h-4" />,
    color: 'orange',
  },
  {
    key: 'activeCustomersAssigned',
    title: 'Aktif Müşteri',
    subtitle: 'Sizin sorumluluğunuzda',
    icon: <Users className="w-4 h-4" />,
    color: 'cyan',
  },
  {
    key: 'activitiesThisWeek',
    title: 'Bu Hafta Aktivite',
    subtitle: 'Görüşme kaydı',
    icon: <Activity className="w-4 h-4" />,
    color: 'purple',
  },
];

export function UserMetricsCards({ autoRefresh = true, refreshInterval = 60000 }: UserMetricsCardsProps) {
  const [metrics, setMetrics] = useState<UserDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/user');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      const result = await response.json();
      setMetrics(result.data.metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METRICS_CONFIG.map((config) => (
          <div key={config.key} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <span>Metrikler yüklenirken hata oluştu</span>
        </div>
        <button
          onClick={fetchMetrics}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-4">
      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METRICS_CONFIG.map((config) => {
          const colors = getColorClasses(config.color);
          const value = metrics[config.key];
          return (
            <div
              key={config.key}
              className={`rounded-xl border ${colors.border} bg-white p-6 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{config.title}</p>
                  <h3 className={`text-3xl font-bold ${colors.text} mt-2`}>
                    {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}{config.suffix || ''}
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
          const value = metrics[config.key];
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
                    {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
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