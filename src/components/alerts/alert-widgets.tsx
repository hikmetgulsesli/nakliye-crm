'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  PhoneOff, 
  FileClock, 
  CalendarX, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import type { AlertCounts, AlertType } from '@/types';

interface AlertWidgetConfig {
  type: AlertType;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  threshold: { medium: number; high: number };
}

const WIDGET_CONFIG: AlertWidgetConfig[] = [
  {
    type: 'no_contact_14d',
    title: 'Aranmayan Müşteriler',
    description: '14+ gündür iletişim yok',
    icon: <PhoneOff className="h-5 w-5" />,
    link: '/customers?filter=no_contact',
    color: 'blue',
    threshold: { medium: 3, high: 10 },
  },
  {
    type: 'pending_quote_7d',
    title: 'Bekleyen Teklifler',
    description: '7+ gündür cevap yok',
    icon: <FileClock className="h-5 w-5" />,
    link: '/quotations?filter=pending_7d',
    color: 'amber',
    threshold: { medium: 3, high: 5 },
  },
  {
    type: 'expired_quote',
    title: 'Süresi Dolan Teklifler',
    description: 'Geçerlilik süresi doldu',
    icon: <CalendarX className="h-5 w-5" />,
    link: '/quotations?filter=expired',
    color: 'red',
    threshold: { medium: 2, high: 3 },
  },
  {
    type: 'high_potential_no_quote_30d',
    title: 'Yüksek Potansiyel',
    description: '30+ gündür teklif yok',
    icon: <TrendingUp className="h-5 w-5" />,
    link: '/customers?filter=high_potential',
    color: 'purple',
    threshold: { medium: 3, high: 5 },
  },
];

interface AlertWidgetsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AlertWidgets({ autoRefresh = true, refreshInterval = 60000 }: AlertWidgetsProps) {
  const [counts, setCounts] = useState<AlertCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/counts');
      if (!response.ok) {
        throw new Error('Failed to fetch alert counts');
      }
      const result = await response.json();
      setCounts(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alert counts');
    } finally {
      setLoading(false);
    }
  }, []);

  const regenerateAlerts = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate alerts');
      }
      await fetchCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate alerts');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    if (autoRefresh) {
      const interval = setInterval(fetchCounts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCounts, autoRefresh, refreshInterval]);

  const getSeverityColor = (count: number, config: AlertWidgetConfig): string => {
    if (count >= config.threshold.high) return 'text-red-600 bg-red-50 border-red-200';
    if (count >= config.threshold.medium) return 'text-amber-600 bg-amber-50 border-amber-200';
    return `text-${config.color}-600 bg-${config.color}-50 border-${config.color}-200`;
  };

  const getBadgeColor = (count: number, config: AlertWidgetConfig): string => {
    if (count >= config.threshold.high) return 'bg-red-500';
    if (count >= config.threshold.medium) return 'bg-amber-500';
    return `bg-${config.color}-500`;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hatırlatıcılar</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {WIDGET_CONFIG.map((config) => (
            <div key={config.type} className="animate-pulse rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchCounts}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!counts) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Hatırlatıcılar</h2>
          {counts.total > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[1.5rem]">
              {counts.total}
            </span>
          )}
        </div>
        <button
          onClick={regenerateAlerts}
          disabled={regenerating}
          aria-label="Regenerate alerts"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {WIDGET_CONFIG.map((config) => {
          const count = counts[config.type];
          const severityClass = getSeverityColor(count, config);
          const badgeClass = getBadgeColor(count, config);

          return (
            <Link
              key={config.type}
              href={config.link}
              className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${severityClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/80">
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.title}</p>
                    <p className="text-xs opacity-75">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 text-lg font-bold text-white rounded-lg ${badgeClass}`}>
                    {count}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View details</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}