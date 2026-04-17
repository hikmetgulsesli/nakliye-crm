import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { Activity } from '@nakliye-crm/shared';

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
}

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: string; bgColor: string; label: string }> = {
  telefon: { icon: 'phone', bgColor: 'bg-blue-500', label: 'Telefon Gorusmesi' },
  eposta: { icon: 'email', bgColor: 'bg-amber-500', label: 'E-posta' },
  yuz_yuze: { icon: 'groups', bgColor: 'bg-emerald-500', label: 'Yuz Yuze Gorusme' },
  video: { icon: 'videocam', bgColor: 'bg-purple-500', label: 'Video Gorusme' },
};

const OUTCOME_CONFIG: Record<string, { dotColor: string; label: string }> = {
  olumlu: { dotColor: 'bg-emerald-500', label: 'Olumlu' },
  notr: { dotColor: 'bg-slate-400', label: 'Notr' },
  olumsuz: { dotColor: 'bg-red-500', label: 'Olumsuz' },
  teklif_istendi: { dotColor: 'bg-blue-500', label: 'Teklif Istendi' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Group activities by date */
function groupByDate(activities: Activity[]): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();
  for (const activity of activities) {
    const dateKey = new Date(activity.activityDate).toLocaleDateString('tr-TR');
    const existing = grouped.get(dateKey) || [];
    existing.push(activity);
    grouped.set(dateKey, existing);
  }
  return grouped;
}

export function ActivityTimeline({ activities, loading = false }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4">
            <div className="flex flex-col items-center">
              <div className="size-10 bg-slate-200 rounded-full" />
              <div className="w-0.5 flex-1 bg-slate-200 mt-2" />
            </div>
            <div className="flex-1 pb-6 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
        Henuz aktivite gecmisi yok
      </div>
    );
  }

  const grouped = groupByDate(activities);

  return (
    <div className="relative">
      {Array.from(grouped.entries()).map(([dateLabel, dateActivities], groupIndex) => (
        <div key={dateLabel} className="mb-6">
          {/* Date header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
              {formatDate(dateActivities[0].activityDate)}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Timeline items */}
          <div className="relative">
            {dateActivities.map((activity, actIdx) => {
              const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activityType] || {
                icon: 'event',
                bgColor: 'bg-slate-400',
                label: activity.activityType,
              };
              const outcomeConfig = activity.outcome
                ? OUTCOME_CONFIG[activity.outcome]
                : null;
              const isLast =
                actIdx === dateActivities.length - 1 &&
                groupIndex === grouped.size - 1;

              return (
                <div key={activity.id} className="flex gap-4 relative">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    {/* Icon circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center size-10 rounded-full text-white z-10',
                        typeConfig.bgColor,
                      )}
                    >
                      <Icon name={typeConfig.icon} size="sm" />
                    </div>
                    {/* Vertical line */}
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-slate-200 min-h-[24px]" />
                    )}
                  </div>

                  {/* Activity card */}
                  <div className="flex-1 pb-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {typeConfig.label}
                          </span>
                          {outcomeConfig && (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span
                                className={cn(
                                  'size-2 rounded-full inline-block',
                                  outcomeConfig.dotColor,
                                )}
                              />
                              {outcomeConfig.label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatTime(activity.activityDate)}
                        </span>
                      </div>

                      {/* Notes */}
                      {activity.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line">
                          {activity.notes}
                        </p>
                      )}

                      {/* Footer info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                        {activity.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Icon name="timer" size="sm" className="!text-[14px]" />
                            {activity.durationMinutes} dakika
                          </span>
                        )}
                        {activity.createdBy && (
                          <span className="flex items-center gap-1">
                            <Icon name="person" size="sm" className="!text-[14px]" />
                            {activity.createdBy.fullName}
                          </span>
                        )}
                        {activity.nextActionDate && (
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Icon name="event" size="sm" className="!text-[14px]" />
                            Sonraki aksiyon:{' '}
                            {new Date(activity.nextActionDate).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
