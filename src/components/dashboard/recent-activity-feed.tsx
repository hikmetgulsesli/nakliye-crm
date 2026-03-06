'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Phone,
  Mail,
  Users,
  Video,
  ArrowRight,
  CheckCircle2,
  MinusCircle,
  XCircle,
  FileText
} from 'lucide-react';
import type { RecentActivity } from '@/types';

interface RecentActivityFeedProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

const OUTCOME_ICONS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  positive: { 
    icon: <CheckCircle2 className="w-3.5 h-3.5" />, 
    color: 'text-emerald-600 bg-emerald-50',
    label: 'Olumlu'
  },
  neutral: { 
    icon: <MinusCircle className="w-3.5 h-3.5" />, 
    color: 'text-gray-600 bg-gray-50',
    label: 'Nötr'
  },
  negative: { 
    icon: <XCircle className="w-3.5 h-3.5" />, 
    color: 'text-red-600 bg-red-50',
    label: 'Olumsuz'
  },
  quote_requested: { 
    icon: <FileText className="w-3.5 h-3.5" />, 
    color: 'text-blue-600 bg-blue-50',
    label: 'Teklif İstendi'
  },
};

export function RecentActivityFeed({ 
  limit = 10, 
  autoRefresh = true, 
  refreshInterval = 60000 
}: RecentActivityFeedProps) {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/user');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const result = await response.json();
      setActivities(result.data.recentActivities.slice(0, limit));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchActivities, autoRefresh, refreshInterval]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      phone: 'bg-blue-100 text-blue-600',
      email: 'bg-purple-100 text-purple-600',
      meeting: 'bg-amber-100 text-amber-600',
      video: 'bg-cyan-100 text-cyan-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-600">Aktiviteler yüklenirken hata oluştu</p>
        <button
          onClick={fetchActivities}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Phone className="w-6 h-6 text-gray-400" />
          </div>
          <p>Henüz aktivite kaydı bulunmuyor</p>
          <p className="text-sm text-gray-400 mt-1">
            Müşteri görüşmelerinizi kaydetmeye başlayın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
        <Link 
          href="/activities" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Tümünü gör
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((activity) => {
          const outcome = activity.outcome ? OUTCOME_ICONS[activity.outcome] : null;
          return (
            <div
              key={activity.id}
              className="flex gap-3 group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {ACTIVITY_ICONS[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{activity.typeLabel}</span>
                  <span className="text-gray-400">•</span>
                  <Link 
                    href={`/customers/${activity.customerId}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline truncate"
                  >
                    {activity.customerName}
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {outcome && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${outcome.color}`}>
                      {outcome.icon}
                      {outcome.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{formatTime(activity.createdAt)}</span>
                </div>
                {activity.notes && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}