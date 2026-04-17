import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { Activity } from '@nakliye-crm/shared';

interface ActivityListProps {
  activities: Activity[];
  loading?: boolean;
  emptyMessage?: string;
}

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  telefon: { icon: 'phone', color: 'bg-blue-500', label: 'Telefon' },
  eposta: { icon: 'email', color: 'bg-amber-500', label: 'E-posta' },
  yuz_yuze: { icon: 'groups', color: 'bg-emerald-500', label: 'Yuz Yuze' },
  video: { icon: 'videocam', color: 'bg-purple-500', label: 'Video' },
};

const OUTCOME_CONFIG: Record<string, { color: string; label: string }> = {
  olumlu: { color: 'text-emerald-600 bg-emerald-50', label: 'Olumlu' },
  notr: { color: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60', label: 'Notr' },
  olumsuz: { color: 'text-red-600 bg-red-50', label: 'Olumsuz' },
  teklif_istendi: { color: 'text-blue-600 bg-blue-50', label: 'Teklif Istendi' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityList({
  activities,
  loading = false,
  emptyMessage = 'Henuz aktivite yok',
}: ActivityListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
            <div className="size-10 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activityType] || {
          icon: 'event',
          color: 'bg-slate-400',
          label: activity.activityType,
        };
        const outcomeConfig = activity.outcome
          ? OUTCOME_CONFIG[activity.outcome] || null
          : null;

        return (
          <div
            key={activity.id}
            className="flex gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 dark:border-slate-800 transition-colors"
          >
            {/* Type icon */}
            <div
              className={cn(
                'flex items-center justify-center size-10 rounded-full text-white flex-shrink-0',
                typeConfig.color,
              )}
            >
              <Icon name={typeConfig.icon} size="sm" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {typeConfig.label}
                </span>
                {outcomeConfig && (
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      outcomeConfig.color,
                    )}
                  >
                    {outcomeConfig.label}
                  </span>
                )}
                {activity.durationMinutes && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                    <Icon name="timer" size="sm" className="!text-[14px]" />
                    {activity.durationMinutes} dk
                  </span>
                )}
              </div>

              {activity.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-1">
                  {activity.notes}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <Icon name="schedule" size="sm" className="!text-[14px]" />
                  {formatDate(activity.activityDate)}
                </span>
                {activity.createdBy && (
                  <span>{activity.createdBy.fullName}</span>
                )}
                {activity.nextActionDate && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Icon name="event" size="sm" className="!text-[14px]" />
                    Sonraki: {new Date(activity.nextActionDate).toLocaleDateString('tr-TR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
