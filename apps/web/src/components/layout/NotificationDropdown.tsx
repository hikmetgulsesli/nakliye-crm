import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';

const iconMap: Record<Notification['type'], { icon: string; bg: string; text: string }> = {
  info: { icon: 'info', bg: 'bg-blue-100', text: 'text-blue-600' },
  warning: { icon: 'warning', bg: 'bg-amber-100', text: 'text-amber-600' },
  success: { icon: 'check_circle', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  error: { icon: 'error', bg: 'bg-red-100', text: 'text-red-600' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 dark:border-slate-800">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Bildirimler</h3>
        <button
          onClick={() => markAllRead()}
          className="text-xs font-medium text-primary hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
        >
          Tümünü Okundu İşaretle
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Bildirim bulunmuyor
          </div>
        ) : (
          notifications.map((n) => {
            const style = iconMap[n.type] || iconMap.info;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markRead(n.id);
                }}
                className={cn(
                  'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/60',
                  !n.isRead && 'bg-primary/5 dark:bg-primary/10',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    style.bg,
                  )}
                >
                  <span className={cn('material-symbols-outlined text-[18px]', style.text)}>
                    {style.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                    {!n.isRead && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 text-center dark:border-slate-800">
        <button
          onClick={() => {
            onClose();
            navigate('/');
          }}
          className="text-sm font-medium text-primary hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
        >
          Tüm Bildirimleri Gör
        </button>
      </div>
    </div>
  );
}
