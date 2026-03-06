'use client';

import { useEffect, useState, useCallback } from 'react';
import { PhoneOff, Clock, AlertTriangle, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { AlertCounts, AlertType } from '@/types/index.js';

interface AlertWidgetProps {
  type: AlertType;
  count: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high';
  href: string;
  onReview: (type: AlertType) => void;
  loading?: boolean;
}

function AlertWidget({ type, count, title, description, icon, severity, href, onReview, loading }: AlertWidgetProps) {
  const severityColors = {
    low: 'border-l-blue-500 bg-blue-50/50',
    medium: 'border-l-yellow-500 bg-yellow-50/50',
    high: 'border-l-red-500 bg-red-50/50',
  };

  const badgeColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  return (
    <div className={\`relative border-l-4 rounded-lg p-4 shadow-sm \${severityColors[severity]} \${loading ? 'opacity-60' : ''}\`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={\`px-3 py-1 rounded-full text-white text-sm font-bold \${badgeColors[severity]}\`}>{count}</span>
          {count > 0 && (
            <button onClick={() => onReview(type)} className="p-1 hover:bg-gray-200 rounded-full" aria-label="Mark as reviewed">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
          )}
        </div>
      </div>
      {count > 0 && (
        <Link href={href} className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          View details →
        </Link>
      )}
    </div>
  );
}

export function AlertWidgets({ refreshInterval = 300000, autoRefresh = true }: { refreshInterval?: number; autoRefresh?: boolean }) {
  const [counts, setCounts] = useState<AlertCounts>({ no_contact_14d: 0, pending_quote_7d: 0, expired_quote: 0, high_potential_no_quote_30d: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alerts?counts=true');
      if (!response.ok) throw new Error('Failed to fetch alert counts');
      const { data } = await response.json();
      setCounts(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch counts');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'regenerate' }) });
      if (!response.ok) throw new Error('Failed to regenerate alerts');
      await fetchCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate alerts');
    } finally {
      setLoading(false);
    }
  }, [fetchCounts]);

  const handleReviewType = useCallback(async () => { await fetchCounts(); }, [fetchCounts]);

  useEffect(() => {
    fetchCounts();
    if (autoRefresh) {
      const interval = setInterval(fetchCounts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCounts, autoRefresh, refreshInterval]);

  const widgets = [
    { type: 'no_contact_14d' as AlertType, count: counts.no_contact_14d, title: 'Aranmayan Müşteriler', description: '14 gündür iletişim kurulmamış', icon: <PhoneOff className="w-5 h-5 text-blue-600" />, severity: counts.no_contact_14d > 10 ? 'high' : counts.no_contact_14d > 5 ? 'medium' : 'low' as const, href: '/alerts?type=no_contact_14d' },
    { type: 'pending_quote_7d' as AlertType, count: counts.pending_quote_7d, title: 'Bekleyen Teklifler', description: '7+ gündür yanıt bekliyor', icon: <Clock className="w-5 h-5 text-yellow-600" />, severity: counts.pending_quote_7d > 5 ? 'high' : counts.pending_quote_7d > 2 ? 'medium' : 'low' as const, href: '/alerts?type=pending_quote_7d' },
    { type: 'expired_quote' as AlertType, count: counts.expired_quote, title: 'Süresi Dolan Teklifler', description: 'Geçerlilik tarihi geçmiş', icon: <AlertTriangle className="w-5 h-5 text-red-600" />, severity: counts.expired_quote > 3 ? 'high' : counts.expired_quote > 0 ? 'medium' : 'low' as const, href: '/alerts?type=expired_quote' },
    { type: 'high_potential_no_quote_30d' as AlertType, count: counts.high_potential_no_quote_30d, title: 'Yüksek Potansiyel', description: '30+ gündür teklif almamış', icon: <TrendingUp className="w-5 h-5 text-green-600" />, severity: counts.high_potential_no_quote_30d > 5 ? 'high' : counts.high_potential_no_quote_30d > 2 ? 'medium' : 'low' as const, href: '/alerts?type=high_potential_no_quote_30d' },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchCounts} className="text-red-600 hover:text-red-800 font-medium">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Hatırlatıcılar
          {counts.total > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{counts.total}</span>}
        </h2>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={handleRegenerate} disabled={loading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" aria-label="Regenerate alerts">
            <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''}\`} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget) => <AlertWidget key={widget.type} {...widget} onReview={handleReviewType} loading={loading} />)}
      </div>
    </div>
  );
}

export default AlertWidgets;
