import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui';

interface RecentActivity {
  id: string;
  date: string;
  customerName: string;
  customerId?: number;
  type: string;
  note: string;
  representative?: string;
}

interface RecentActivitiesWidgetProps {
  activities: RecentActivity[];
  showRepresentative?: boolean;
  className?: string;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TYPE_BADGE_MAP: Record<string, BadgeVariant> = {
  Arama: 'info',
  arama: 'info',
  Teklif: 'warning',
  teklif: 'warning',
  Toplanti: 'neutral',
  toplanti: 'neutral',
  Kazanıldı: 'success',
  kazanıldı: 'success',
  Kaybedildi: 'danger',
  kaybedildi: 'danger',
  Not: 'neutral',
  not: 'neutral',
  'E-posta': 'info',
  eposta: 'info',
};

function getTypeBadgeVariant(type: string): BadgeVariant {
  return TYPE_BADGE_MAP[type] || 'neutral';
}

export function RecentActivitiesWidget({
  activities,
  showRepresentative = false,
  className,
}: RecentActivitiesWidgetProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
          Son Aktiviteler
        </h3>
        <button
          onClick={() => navigate('/musteriler')}
          className="text-primary text-sm font-medium hover:underline"
        >
          Tümünü Gör
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Not
              </th>
              {showRepresentative && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Temsilci
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={showRepresentative ? 5 : 4}
                  className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  Henuz aktivite bulunmuyor.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  onClick={() => {
                    if (activity.customerId) {
                      navigate(`/müşteriler/${activity.customerId}`);
                    }
                  }}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors',
                    activity.customerId && 'cursor-pointer',
                  )}
                >
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.customerName}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getTypeBadgeVariant(activity.type)}>
                      {activity.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {activity.note}
                  </td>
                  {showRepresentative && (
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {activity.representative || '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
