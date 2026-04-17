import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

interface FollowUpItem {
  id: string;
  customerName: string;
  date: string;
  type: 'call' | 'email' | 'meeting';
  note?: string;
}

interface FollowUpWidgetProps {
  followUps: FollowUpItem[];
  className?: string;
}

const TYPE_CONFIG: Record<
  FollowUpItem['type'],
  { icon: string; bg: string; color: string }
> = {
  call: { icon: 'call', bg: 'bg-orange-100', color: 'text-orange-600' },
  email: { icon: 'mail', bg: 'bg-blue-100', color: 'text-blue-600' },
  meeting: { icon: 'meeting_room', bg: 'bg-primary/10', color: 'text-primary' },
};

export function FollowUpWidget({ followUps, className }: FollowUpWidgetProps) {
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
          Yaklasan Takipler
        </h3>
        <button
          onClick={() => navigate('/musteriler')}
          className="text-primary text-sm font-medium hover:underline"
        >
          Tümünü Gör
        </button>
      </div>

      {/* Follow-up list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {followUps.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Yaklasan takip bulunmuyor.
          </div>
        ) : (
          followUps.map((item) => {
            const config = TYPE_CONFIG[item.type];
            return (
              <div
                key={item.id}
                className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors cursor-pointer"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center p-2 rounded-lg shrink-0 mt-0.5',
                    config.bg,
                  )}
                >
                  <Icon name={config.icon} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.customerName}
                    </h4>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shrink-0">
                      {item.date}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {item.note}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <Icon
                  name="chevron_right"
                  size="sm"
                  className="text-slate-400 dark:text-slate-500 shrink-0 mt-1"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
