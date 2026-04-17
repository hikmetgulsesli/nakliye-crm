import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
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

  const executeSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed) {
        navigate(`/musteriler?search=${encodeURIComponent(trimmed)}`);
      }
    },
    [navigate],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        executeSearch(value);
      }, 300);
    },
    [executeSearch],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        executeSearch(searchQuery);
      }
    },
    [executeSearch, searchQuery],
  );

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
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 dark:text-slate-500">
            search
          </span>
          <input
            type="text"
            placeholder="Musteri, teklif veya sevkiyat ara..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-96 rounded-full bg-slate-100 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:text-slate-400"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Acik temaya gec' : 'Koyu temaya gec'}
          title={theme === 'dark' ? 'Acik tema' : 'Koyu tema'}
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
              {user?.fullName || 'Kullanici'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
