import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';

interface Event {
  id: string;
  type: string;
  icon: string;
  at: string;
  actor: string | null;
  title: string;
  detail?: string;
  link?: string;
}

export function CustomerTimeline({ customerId }: { customerId: number }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Event[]>(`/timeline/customers/${customerId}`)
      .then((res) => setEvents(res.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <Card title="Zaman Çizelgesi">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </Card>
    );
  }

  return (
    <Card title="Zaman Çizelgesi">
      {!events || events.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Henüz olay yok.</p>
      ) : (
        <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-5 space-y-4">
          {events.map((e) => {
            const inner = (
              <>
                <div className="absolute -left-[27px] size-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Icon name={e.icon} size="sm" className="text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 text-xs text-slate-500">
                    <span>{new Date(e.at).toLocaleString('tr-TR')}</span>
                    {e.actor && <span>· {e.actor}</span>}
                  </div>
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                    {e.title}
                  </div>
                  {e.detail && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                      {e.detail}
                    </div>
                  )}
                </div>
              </>
            );
            return (
              <li key={e.id} className="relative">
                {e.link ? (
                  <Link to={e.link} className="block hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 -ml-2 transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <div className="p-2 -ml-2">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
