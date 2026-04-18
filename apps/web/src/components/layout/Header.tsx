import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useThemeStore } from '@/stores/themeStore';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationStore();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [notifOpen, setNotifOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const toggleNotif = useCallback(() => {
    setNotifOpen((prev) => !prev);
  }, []);

  const closeNotif = useCallback(() => {
    setNotifOpen(false);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 dark:border-slate-800 dark:bg-slate-900">
      {/* Left: Page Title */}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Search — cmd+K trigger */}
        <button
          type="button"
          onClick={() => {
            // Dispatch keyboard event to open CommandPalette
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
            );
          }}
          className="relative flex items-center w-96 rounded-full bg-slate-100 dark:bg-slate-800 py-2.5 pl-10 pr-14 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 dark:text-slate-500">
            search
          </span>
          <span className="flex-1 text-left">Müşteri, teklif, sevkiyat ara...</span>
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Açık temaya gec' : 'Koyu temaya gec'}
          title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
          className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotif}
            aria-label="Bildirimler"
            className={cn(
              'relative rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-800',
              notifOpen && 'bg-slate-100 dark:bg-slate-800',
            )}
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-red-500 dark:border-slate-900" />
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={closeNotif} />
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user?.fullName || 'Kullanıcı'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
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
