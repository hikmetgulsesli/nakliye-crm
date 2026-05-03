import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import api from '@/config/api';
import { cn } from '@/utils/cn';

type FilterMode = 'all' | 'unread' | 'read';

const ICON_MAP: Record<Notification['type'], { icon: string; bg: string; text: string }> = {
  info: { icon: 'info', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-300' },
  warning: { icon: 'warning', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-300' },
  success: { icon: 'check_circle', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-300' },
  error: { icon: 'error', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300' },
};

function formatStamp(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/**
 * Bildirim link'ini gezinilebilir Turkce path'e normalize eder.
 * Eski kayitlardaki Ingilizce path'leri (ornegin /customers/12) Turkce
 * karsiligina cevirir; frontend rotalari yalnizca Turkce path tanir.
 */
function normalizeLink(link?: string | null): string | null {
  if (!link) return null;
  if (!link.startsWith('/')) return null;
  return link
    .replace(/^\/customers(\/|$)/, '/musteriler$1')
    .replace(/^\/quotations(\/|$)/, '/teklifler$1')
    .replace(/^\/shipments(\/|$)/, '/sevkiyatlar$1');
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { markRead, markAllRead } = useNotificationStore();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);

  async function fetchPage() {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 100 };
      if (filter === 'unread') params.isRead = false;
      if (filter === 'read') params.isRead = true;
      const { data } = await api.get<{
        data: Notification[];
        total: number;
        unreadCount?: number;
      }>('/notifications', { params });
      setItems(Array.isArray(data?.data) ? data.data : []);
      setTotal(data?.total ?? 0);
      if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const target = normalizeLink(n.link);
    if (target) navigate(target);
  }

  async function handleMarkAllRead() {
    await markAllRead();
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }

  const filterOptions: { value: FilterMode; label: string; badge?: number }[] = useMemo(
    () => [
      { value: 'all', label: 'Tümü', badge: total },
      { value: 'unread', label: 'Okunmamış', badge: unreadCount },
      { value: 'read', label: 'Okunmuş' },
    ],
    [total, unreadCount],
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Bildirimler' }]}
        title="Bildirimler"
        action={
          unreadCount > 0 ? (
            <Button variant="secondary" icon="done_all" onClick={handleMarkAllRead}>
              Tümünü okundu işaretle
            </Button>
          ) : undefined
        }
      />

      {/* Filter chip'leri */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((opt) => {
          const active = opt.value === filter;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              <span>{opt.label}</span>
              {opt.badge !== undefined && opt.badge > 0 && (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
                  )}
                >
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications_off"
          title={filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim bulunmuyor'}
          description="Yeni bir bildirim geldiğinde burada listelenecek."
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const style = ICON_MAP[n.type] || ICON_MAP.info;
            const target = normalizeLink(n.link);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                  n.isRead
                    ? 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                    : 'border-primary/20 bg-primary/5 hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/10',
                )}
              >
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    style.bg,
                  )}
                >
                  <span className={cn('material-symbols-outlined text-[20px]', style.text)}>
                    {style.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatStamp(n.createdAt)}
                    </span>
                    {target && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary dark:text-primary-300">
                        Aç
                        <span className="material-symbols-outlined text-[16px] leading-none">
                          arrow_forward
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
