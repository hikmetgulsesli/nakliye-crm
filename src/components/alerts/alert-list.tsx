'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PhoneOff, Clock, AlertTriangle, TrendingUp, CheckCircle, X, Filter, RefreshCw } from 'lucide-react';
import type { AlertWithDetails, AlertType, AlertStatus } from '@/types/index.js';

const alertTypeConfig: Record<AlertType, { label: string; icon: React.ReactNode; color: string }> = {
  no_contact_14d: { label: '14 Gündür İletişim Yok', icon: <PhoneOff className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
  pending_quote_7d: { label: '7+ Gündür Bekleyen Teklif', icon: <Clock className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800' },
  expired_quote: { label: 'Süresi Dolmuş Teklif', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-red-100 text-red-800' },
  high_potential_no_quote_30d: { label: 'Yüksek Potansiyel - Teklif Yok', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-green-100 text-green-800' },
};

const severityColors = { low: 'bg-gray-100 text-gray-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-red-100 text-red-800' };
const statusColors = { active: 'bg-blue-100 text-blue-800', reviewed: 'bg-green-100 text-green-800', dismissed: 'bg-gray-100 text-gray-800' };

export function AlertList({ initialType }: { initialType?: AlertType }) {
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ type: AlertType | ''; status: AlertStatus | '' }>({
    type: initialType || (searchParams.get('type') as AlertType) || '',
    status: 'active',
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.status) params.set('status', filter.status);
      const response = await fetch(\`/api/alerts?\${params.toString()}\`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const { data } = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleReview = async (alertId: string) => {
    try {
      const response = await fetch(\`/api/alerts/\${alertId}\`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'review', reviewed_by: 'current-user' }) });
      if (!response.ok) throw new Error('Failed to mark as reviewed');
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(\`/api/alerts/\${alertId}\`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dismiss' }) });
      if (!response.ok) throw new Error('Failed to dismiss alert');
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss alert');
    }
  };

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading) return <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchAlerts} className="text-red-600 hover:text-red-800 font-medium">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select value={filter.type} onChange={(e) => setFilter(f => ({ ...f, type: e.target.value as AlertType | '' }))} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
          <option value="">All Types</option>
          {Object.entries(alertTypeConfig).map(([type, config]) => <option key={type} value={type}>{config.label}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter(f => ({ ...f, status: e.target.value as AlertStatus | '' }))} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button onClick={fetchAlerts} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Apply</button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-lg font-medium">No alerts found</p>
          <p className="text-sm">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={\`p-2 rounded-lg \${alertTypeConfig[alert.type].color}\`}>{alertTypeConfig[alert.type].icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={\`px-2 py-0.5 text-xs font-medium rounded-full \${alertTypeConfig[alert.type].color}\`}>{alertTypeConfig[alert.type].label}</span>
                      <span className={\`px-2 py-0.5 text-xs font-medium rounded-full \${severityColors[alert.severity]}\`}>{alert.severity}</span>
                      <span className={\`px-2 py-0.5 text-xs font-medium rounded-full \${statusColors[alert.status]}\`}>{alert.status}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Entity: {alert.entity_name}</span>
                      {alert.assigned_user_name && <span>Assigned: {alert.assigned_user_name}</span>}
                      <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.entity_type === 'customer' && <Link href={\`/customers/\${alert.entity_id}\`} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md">View Customer</Link>}
                  {alert.status === 'active' && (
                    <>
                      <button onClick={() => handleReview(alert.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md" aria-label="Mark as reviewed"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => handleDismiss(alert.id)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md" aria-label="Dismiss"><X className="w-5 h-5" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertList;
