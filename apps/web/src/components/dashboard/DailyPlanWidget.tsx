import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Skeleton } from '@/components/ui';
import api from '@/config/api';
import { useFeature } from '@/stores/featuresStore';

interface DailyPlanData {
  date: string;
  followups: Array<{
    id: number;
    activityType: string | null;
    customerId: number;
    customer?: { id: number; companyName: string; phone: string };
    nextActionDate: string;
    notes: string | null;
  }>;
  expiringQuotes: Array<{
    id: number;
    quoteNo: string;
    validityDate: string;
    customer?: { id: number; companyName: string; phone: string };
  }>;
  pendingQuotes: Array<{
    id: number;
    quoteNo: string;
    createdAt: string;
    customer?: { id: number; companyName: string; phone: string };
  }>;
  uncontacted: Array<{
    id: number;
    companyName: string;
    phone: string;
    lastContactDate: string | null;
    potential: string | null;
  }>;
  counts: {
    followups: number;
    expiringQuotes: number;
    pendingQuotes: number;
    uncontacted: number;
    total: number;
  };
}

export function DailyPlanWidget() {
  const [data, setData] = useState<DailyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const clickToCall = useFeature('click_to_call');

  useEffect(() => {
    api
      .get<DailyPlanData>('/daily-plan/today')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const phoneHref = (phone: string) =>
    clickToCall ? `tel:${phone.replace(/[^0-9+]/g, '')}` : undefined;

  if (loading) {
    return (
      <Card title="🌅 Bugünün İşleri">
        <Skeleton variant="text" />
      </Card>
    );
  }
  if (!data || data.counts.total === 0) {
    return (
      <Card title="🌅 Bugünün İşleri">
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
          <Icon name="check_circle" className="text-emerald-500" />
          Bugün için bekleyen iş yok. Planlı çalışmaya devam.
        </div>
      </Card>
    );
  }

  return (
    <Card title={`🌅 Bugünün İşleri (${data.counts.total})`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <Stat count={data.counts.followups} label="Follow-up" tone="info" />
        <Stat count={data.counts.expiringQuotes} label="Bugün Dolan" tone="warn" />
        <Stat count={data.counts.pendingQuotes} label="7+ gün bekleyen" tone="neutral" />
        <Stat count={data.counts.uncontacted} label="14+ gün aranmayan" tone="danger" />
      </div>

      {data.followups.length > 0 && (
        <Section title="🔔 Bugün Konuşma Planım" count={data.followups.length}>
          <ul className="space-y-1 text-sm">
            {data.followups.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <Link
                  to={`/musteriler/${f.customerId}`}
                  className="text-primary hover:underline flex-1 truncate"
                >
                  {f.customer?.companyName}
                </Link>
                <span className="text-xs text-slate-500">{f.activityType}</span>
                {f.customer?.phone && phoneHref(f.customer.phone) && (
                  <a
                    href={phoneHref(f.customer.phone)}
                    className="text-emerald-500 hover:text-emerald-600"
                    title="Ara"
                  >
                    <Icon name="phone" size="sm" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.expiringQuotes.length > 0 && (
        <Section title="⏰ Bugün Süresi Dolan Teklifler" count={data.expiringQuotes.length}>
          <ul className="space-y-1 text-sm">
            {data.expiringQuotes.map((q) => (
              <li key={q.id} className="flex items-center gap-2">
                <Link to={`/teklifler/${q.id}`} className="text-primary hover:underline flex-1 truncate">
                  {q.quoteNo} · {q.customer?.companyName}
                </Link>
                {q.customer?.phone && phoneHref(q.customer.phone) && (
                  <a
                    href={phoneHref(q.customer.phone)}
                    className="text-emerald-500"
                    title="Ara"
                  >
                    <Icon name="phone" size="sm" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.uncontacted.length > 0 && (
        <Section title="📵 Uzun Süre Aranmayan Müşterilerim" count={data.uncontacted.length}>
          <ul className="space-y-1 text-sm">
            {data.uncontacted.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <Link to={`/musteriler/${c.id}`} className="text-primary hover:underline flex-1 truncate">
                  {c.companyName}
                </Link>
                {c.potential === 'Yüksek' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    Yüksek Potansiyel
                  </span>
                )}
                {phoneHref(c.phone) && (
                  <a href={phoneHref(c.phone)} className="text-emerald-500" title="Ara">
                    <Icon name="phone" size="sm" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </Card>
  );
}

function Stat({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: 'info' | 'warn' | 'neutral' | 'danger';
}) {
  const styles = {
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    warn: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  }[tone];
  return (
    <div className={`rounded-xl p-3 ${styles}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 border-t border-slate-100 dark:border-slate-800 first:border-t-0">
      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
        {title} · {count}
      </h4>
      {children}
    </div>
  );
}
