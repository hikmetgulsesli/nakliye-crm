import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar, Icon } from '@/components/ui';

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  contactedCustomers: number;
  lastActivity: string;
  isTopPerformer?: boolean;
}

interface TeamPerformanceTableProps {
  data: TeamMember[];
  className?: string;
}

export function TeamPerformanceTable({ data, className }: TeamPerformanceTableProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-display font-bold text-lg text-slate-900">
          Satis Temsilcisi Performansi
        </h3>
        <button
          onClick={() => navigate('/kullanicilar')}
          className="text-sm font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
        >
          Tumunu Gor
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Temsilci
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Teklif Sayisi
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kazanilan
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kazanma %
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gorusulen Musteri
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Son Aktivite
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((member) => (
              <tr
                key={member.id}
                className={cn(
                  'hover:bg-slate-50 transition-colors',
                  member.isTopPerformer && 'bg-emerald-50/40',
                )}
              >
                {/* Temsilci */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.avatarUrl}
                      name={member.name}
                      size="sm"
                    />
                    <span className="font-medium text-sm text-slate-900">
                      {member.name}
                    </span>
                    {member.isTopPerformer && (
                      <Icon
                        name="emoji_events"
                        size="sm"
                        className="text-amber-500"
                      />
                    )}
                  </div>
                </td>

                {/* Teklif Sayisi */}
                <td className="px-6 py-4 text-sm text-slate-700">
                  {member.quoteCount}
                </td>

                {/* Kazanilan */}
                <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                  {member.wonCount}
                </td>

                {/* Kazanma % */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          member.winRate >= 50
                            ? 'bg-emerald-500'
                            : member.winRate >= 35
                              ? 'bg-amber-400'
                              : 'bg-red-400',
                        )}
                        style={{ width: `${Math.min(member.winRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      %{member.winRate}
                    </span>
                  </div>
                </td>

                {/* Gorusulen Musteri */}
                <td className="px-6 py-4 text-sm text-slate-500">
                  {member.contactedCustomers}
                </td>

                {/* Son Aktivite */}
                <td className="px-6 py-4 text-sm text-slate-500">
                  {member.lastActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
