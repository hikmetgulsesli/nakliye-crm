'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneOff,
  FileClock,
  CalendarX,
  TrendingUp,
  User,
  ExternalLink,
  Filter,
  RefreshCw,
} from 'lucide-react';
import type { Alert, AlertType, AlertStatus, AlertSeverity } from '@/types';

const TYPE_CONFIG: Record<AlertType, { label: string; icon: React.ReactNode; color: string }> = {
  no_contact_14d: { label: 'İletişim Yok', icon: <PhoneOff className="h-4 w-4" />, color: 'blue' },
  pending_quote_7d: { label: 'Bekleyen Teklif', icon: <FileClock className="h-4 w-4" />, color: 'amber' },
  expired_quote: { label: 'Süresi Dolan', icon: <CalendarX className="h-4 w-4" />, color: 'red' },
  high_potential_no_quote_30d: { label: 'Yüksek Potansiyel', icon: <TrendingUp className="h-4 w-4" />, color: 'purple' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string }> = {
  low: { label: 'Düşük', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Orta', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'Yüksek', color: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-blue-100 text-blue-700' },
  reviewed: { label: 'İncelendi', color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-600' },
};

interface AlertListProps {
  filter?: AlertType;
}

export function AlertList({ filter }: AlertListProps) {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    type: filter || (searchParams.get('type') as AlertType) || '',
    status: (searchParams.get('status') as AlertStatus) || 'active',
    severity: '',
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);

      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const result = await response.json();
      setAlerts(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleReview = async (alertId: string) => {
    setUpdating(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review' }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark alert as reviewed');
      }
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    } finally {
      setUpdating(null);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setUpdating(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      });
      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    } finally {
      setUpdating(null);
    }
  };

  const getEntityLink = (alert: Alert): string => {
    if (alert.entity_type === 'customer') {
      return `/customers/${alert.entity_id}`;
    }
    return `/quotations/${alert.entity_id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchAlerts}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as AlertType })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tüm Türler</option>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as AlertStatus })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value as AlertSeverity })}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tüm Önem Dereceleri</option>
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <button
          onClick={fetchAlerts}
          className="ml-auto flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Apply
        </button>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No alerts found</h3>
          <p className="text-gray-500">All caught up! No alerts matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const typeConfig = TYPE_CONFIG[alert.type];
            const severityConfig = SEVERITY_CONFIG[alert.severity];
            const statusConfig = STATUS_CONFIG[alert.status];

            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${
                  alert.status === 'active' ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${severityConfig.color}`}>
                        {typeConfig.icon}
                        {typeConfig.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}>
                        {severityConfig.label}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-semibold text-gray-900">{alert.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">{alert.description}</p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      {alert.assigned_user_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          Assigned: {alert.assigned_user_name}
                        </span>
                      )}
                      <span>Created: {new Date(alert.created_at).toLocaleDateString('tr-TR')}</span>
                      {alert.reviewed_by_name && (
                        <span className="text-green-600">
                          Reviewed by {alert.reviewed_by_name} on {new Date(alert.reviewed_at!).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={getEntityLink(alert)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {alert.entity_type === 'customer' ? 'View Customer' : 'View Quotation'}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    {alert.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(alert.id)}
                          disabled={updating === alert.id}
                          aria-label="Mark as reviewed"
                          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Review
                        </button>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          disabled={updating === alert.id}
                          aria-label="Dismiss"
                          className="inline-flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
