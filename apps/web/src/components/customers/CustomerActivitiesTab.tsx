import { useState, useEffect } from 'react';
import { Icon, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import api from '@/config/api';
import type { Activity, PaginatedResponse } from '@nakliye-crm/shared';

interface CustomerActivitiesTabProps {
  customerId: number;
}

const ACTIVITY_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  Telefon: { icon: 'phone', color: 'bg-blue-100 text-blue-600' },
  'E-posta': { icon: 'mail', color: 'bg-purple-100 text-purple-600' },
  Toplanti: { icon: 'groups', color: 'bg-emerald-100 text-emerald-600' },
  Ziyaret: { icon: 'location_on', color: 'bg-amber-100 text-amber-600' },
  Teklif: { icon: 'request_quote', color: 'bg-indigo-100 text-indigo-600' },
  Not: { icon: 'note', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dun';
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
  return `${Math.floor(diffDays / 30)} ay önce`;
}

export function CustomerActivitiesTab({ customerId }: CustomerActivitiesTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const { data } = await api.get<PaginatedResponse<Activity>>(
          '/activities',
          { params: { customerId, pageSize: 50 } },
        );
        setActivities(data.data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [customerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <EmptyState
          icon="timeline"
          title="Henuz aktivite yok"
          description="Bu müşteriye ait aktivite bulunamadı."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
        Aktiviteler
        <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
          ({activities.length})
        </span>
      </h3>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-6">
          {activities.map((activity) => {
            const typeConfig = ACTIVITY_TYPE_ICONS[activity.activityType] || {
              icon: 'event',
              color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
            };

            return (
              <div key={activity.id} className="relative flex gap-4 pl-0">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center size-10 rounded-full flex-shrink-0',
                    typeConfig.color,
                  )}
                >
                  <Icon name={typeConfig.icon} size="sm" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {activity.activityType}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activity.createdBy?.fullName} -{' '}
                        {formatDateTime(activity.activityDate)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {formatRelative(activity.activityDate)}
                    </span>
                  </div>

                  {activity.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
                      {activity.notes}
                    </p>
                  )}

                  {activity.outcome && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Icon name="check_circle" size="sm" className="text-emerald-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Sonuc: {activity.outcome}
                      </span>
                    </div>
                  )}

                  {activity.nextActionDate && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Icon name="event" size="sm" className="text-amber-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Sonraki işlem:{' '}
                        {new Date(activity.nextActionDate).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  )}

                  {activity.durationMinutes && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <Icon name="schedule" size="sm" />
                      {activity.durationMinutes} dk
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
