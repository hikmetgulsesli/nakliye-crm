import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleNotif = useCallback(() => {
    setNotifOpen((prev) => !prev);
  }, []);

  const closeNotif = useCallback(() => {
    setNotifOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      {/* Left: Page Title */}
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Musteri, teklif veya sevkiyat ara..."
            className="w-96 rounded-full bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotif}
            className={cn(
              'relative rounded-full p-2 transition-colors hover:bg-slate-100',
              notifOpen && 'bg-slate-100',
            )}
          >
            <span className="material-symbols-outlined text-slate-600">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-red-500" />
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={closeNotif} />
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {user?.fullName || 'Kullanici'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.role === 'ADMIN' ? 'Yonetici' : 'Kullanici'}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {user?.fullName
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
