'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar,
  ArrowRight
} from 'lucide-react';
import type { UpcomingFollowUp } from '@/types';

interface UpcomingFollowUpsProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function UpcomingFollowUps({ 
  limit = 5, 
  autoRefresh = true, 
  refreshInterval = 60000 
}: UpcomingFollowUpsProps) {
  const [followUps, setFollowUps] = useState<UpcomingFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/user');
      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups');
      }
      const result = await response.json();
      setFollowUps(result.data.upcomingFollowUps.slice(0, limit));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch follow-ups');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFollowUps();

    if (autoRefresh) {
      const interval = setInterval(fetchFollowUps, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchFollowUps, autoRefresh, refreshInterval]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpDate = new Date(dateStr);
    followUpDate.setHours(0, 0, 0, 0);
    
    const diffTime = followUpDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Yarın';
    if (diffDays < 7) return `${diffDays} gün sonra`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Yaklaşan Follow-up&apos;lar</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-600">Follow-up&apos;lar yüklenirken hata oluştu</p>
        <button
          onClick={fetchFollowUps}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (followUps.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Yaklaşan Follow-up&apos;lar</h2>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Yaklaşan follow-up bulunmuyor</p>
          <p className="text-sm text-gray-400 mt-1">
            Aktivite kaydederken &quot;Sonraki Aksiyon Tarihi&quot; ekleyin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Yaklaşan Follow-up&apos;lar</h2>
        <Link 
          href="/activities" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Tümünü gör
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {followUps.map((followUp) => (
          <Link
            key={followUp.id}
            href={`/customers/${followUp.customerId}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 truncate">{followUp.customerName}</p>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {formatDate(followUp.nextActionDate)}
                </span>
              </div>
              {followUp.notes && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{followUp.notes}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 self-center" />
          </Link>
        ))}
      </div>
    </div>
  );
}