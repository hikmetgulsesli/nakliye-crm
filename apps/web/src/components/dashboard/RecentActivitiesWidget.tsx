import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui';

interface RecentActivity {
  id: string;
  date: string;
  customerName: string;
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
  Kazanildi: 'success',
  kazanildi: 'success',
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
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-slate-900">
          Son Aktiviteler
        </h3>
        <button className="text-primary text-sm font-medium hover:underline">
          Tumunu Gor
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Musteri
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Not
              </th>
              {showRepresentative && (
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Temsilci
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={showRepresentative ? 5 : 4}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  Henuz aktivite bulunmuyor.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {activity.customerName}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getTypeBadgeVariant(activity.type)}>
                      {activity.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {activity.note}
                  </td>
                  {showRepresentative && (
                    <td className="px-6 py-4 text-sm text-slate-500">
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
