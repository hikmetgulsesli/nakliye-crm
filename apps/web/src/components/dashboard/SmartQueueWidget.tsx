import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';
import { useFeature } from '@/stores/featuresStore';

interface Item {
  customerId: number;
  companyName: string;
  phone: string;
  priority: number;
  reasons: string[];
  lastContactDate: string | null;
  openQuoteCount: number;
}

export function SmartQueueWidget() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const clickToCall = useFeature('click_to_call');

  useEffect(() => {
    api
      .get<Item[]>('/ai/smart-queue?limit=8')
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Card title="🤖 AI: Bugün Bunlarla Konuş">
        <Skeleton variant="text" />
      </Card>
    );

  return (
    <Card title="🤖 AI: Bugün Bunlarla Konuş">
      {!items || items.length === 0 ? (
        <p className="text-sm text-slate-500 py-2">Öncelik önerisi yok.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li
              key={i.customerId}
              className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/musteriler/${i.customerId}`}
                  className="font-medium text-sm hover:text-primary truncate block"
                >
                  {i.companyName}
                </Link>
                <div className="text-xs text-slate-500 mt-0.5">
                  {i.reasons.slice(0, 2).join(' · ')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">%{i.priority}</span>
                {clickToCall && i.phone && (
                  <a
                    href={`tel:${i.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-emerald-500 hover:text-emerald-600"
                    title="Ara"
                  >
                    <Icon name="phone" size="sm" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
