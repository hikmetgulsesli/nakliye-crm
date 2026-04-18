import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar, Icon } from '@/components/ui';
import { CoachingPanel } from '@/components/ai/CoachingPanel';

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
  const [coachingFor, setCoachingFor] = useState<{ id: number; name: string } | null>(null);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
          Satış Temsilcisi Performansı
        </h3>
        <button
          onClick={() => navigate('/kullanicilar')}
          className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1"
        >
          Tümünü Gör
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Temsilci
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Teklif Sayısı
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kazanılan
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Kazanma %
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Görüşülen Müşteri
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Son Aktivite
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                AI
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((member) => (
              <tr
                key={member.id}
                className={cn(
                  'hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors',
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
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
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

                {/* Teklif Sayısı */}
                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                  {member.quoteCount}
                </td>

                {/* Kazanılan */}
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
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      %{member.winRate}
                    </span>
                  </div>
                </td>

                {/* Görüşülen Müşteri */}
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {member.contactedCustomers}
                </td>

                {/* Son Aktivite */}
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {member.lastActivity}
                </td>

                {/* AI Koçluk butonu */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setCoachingFor({ id: Number(member.id), name: member.name })}
                    className="inline-flex items-center justify-center size-8 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    title="AI Koçluk Önerileri"
                  >
                    <Icon name="auto_awesome" size="sm" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {coachingFor && (
        <CoachingPanel
          isOpen={!!coachingFor}
          onClose={() => setCoachingFor(null)}
          userId={coachingFor.id}
          userName={coachingFor.name}
        />
      )}
    </div>
  );
}
