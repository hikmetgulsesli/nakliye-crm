import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

interface AlertData {
  id: string;
  type: 'uncalled' | 'pending' | 'expired' | 'highPotential';
  count: number;
  description: string;
}

interface AlertWidgetsProps {
  alerts: AlertData[];
  className?: string;
}

const ALERT_ROUTES: Record<AlertData['type'], string> = {
  uncalled: '/musteriler',
  pending: '/teklifler?status=Bekliyor',
  expired: '/teklifler',
  highPotential: '/müşteriler?potential=Yüksek',
};

const ALERT_CONFIG: Record<
  AlertData['type'],
  { border: string; iconBg: string; iconColor: string; icon: string; title: string }
> = {
  uncalled: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: 'phone_missed',
    title: 'Aranmayan Müşteriler',
  },
  pending: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    icon: 'hourglass_top',
    title: 'Bekleyen Teklifler',
  },
  expired: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: 'schedule',
    title: 'Süresi Dolan Teklifler',
  },
  highPotential: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: 'star',
    title: 'Yüksek Potansiyel',
  },
};

export function AlertWidgets({ alerts, className }: AlertWidgetsProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.type];
        return (
          <div
            key={alert.id}
            onClick={() => navigate(ALERT_ROUTES[alert.type])}
            className={cn(
              'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 border-l-4 hover:shadow-md transition-shadow cursor-pointer',
              config.border,
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex items-center justify-center size-10 rounded-lg shrink-0',
                  config.iconBg,
                )}
              >
                <Icon name={config.icon} className={config.iconColor} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{config.title}</h4>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                    {alert.count}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{alert.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
