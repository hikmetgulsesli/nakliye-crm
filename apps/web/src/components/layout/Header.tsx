import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useThemeStore } from '@/stores/themeStore';
import { Icon } from '@/components/ui';
import NotificationDropdown from './NotificationDropdown';
import { TweaksDropdown } from './TweaksDropdown';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/musteriler': 'Müşteriler',
  '/teklifler': 'Teklifler',
  '/sevkiyatlar': 'Sevkiyatlar',
  '/raporlar': 'Raporlar',
  '/kullanicilar': 'Kullanıcı Yönetimi',
  '/liste-yonetimi': 'Liste Yönetimi',
  '/ayarlar': 'Sistem Ayarları',
  '/loglar': 'Loglar',
  '/devir': 'Veri Devir',
  '/profil': 'Profilim',
};

function deriveCrumbs(pathname: string): string[] {
  // Statik eslestirme
  if (PAGE_LABELS[pathname]) return ['Çalışma alanı', PAGE_LABELS[pathname]];

  // Dinamik route'lar
  if (/^\/musteriler\/yeni$/.test(pathname)) return ['Çalışma alanı', 'Müşteriler', 'Yeni'];
  if (/^\/musteriler\/[^/]+\/duzenle$/.test(pathname))
    return ['Çalışma alanı', 'Müşteriler', 'Düzenle'];
  if (/^\/musteriler\/[^/]+$/.test(pathname)) return ['Çalışma alanı', 'Müşteriler', 'Detay'];
  if (/^\/teklifler\/yeni$/.test(pathname)) return ['Çalışma alanı', 'Teklifler', 'Yeni'];
  if (/^\/teklifler\/[^/]+\/duzenle$/.test(pathname))
    return ['Çalışma alanı', 'Teklifler', 'Düzenle'];
  if (/^\/teklifler\/[^/]+$/.test(pathname)) return ['Çalışma alanı', 'Teklifler', 'Detay'];
  if (/^\/sevkiyatlar\/yeni$/.test(pathname)) return ['Çalışma alanı', 'Sevkiyatlar', 'Yeni'];
  if (/^\/sevkiyatlar\/[^/]+$/.test(pathname)) return ['Çalışma alanı', 'Sevkiyatlar', 'Detay'];

  return ['Çalışma alanı'];
}

interface HeaderProps {
  onOpenAI?: () => void;
}

export default function Header({ onOpenAI }: HeaderProps = {}) {
  const { user } = useAuthStore();
  const { unreadCount, fetch: fetchNotifications } = useNotificationStore();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const location = useLocation();
  const crumbs = deriveCrumbs(location.pathname);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const prevUnreadRef = useRef(unreadCount);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Okunmamis sayisi artarsa zili 1 sn salla — yeni bildirim geldigine isaret
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setRinging(true);
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
      ringTimerRef.current = setTimeout(() => setRinging(false), 1000);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    return () => {
      if (ringTimerRef.current) clearTimeout(ringTimerRef.current);
    };
  }, []);

  const toggleNotif = useCallback(() => setNotifOpen((p) => !p), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-token-border bg-token-bg-elev px-4"
      style={{ height: 'var(--topbar-h)' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-token-muted">
        {crumbs.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-token-subtle">/</span>}
            <span
              className={cn(
                i === crumbs.length - 1 ? 'font-medium text-token-text' : '',
              )}
            >
              {c}
            </span>
          </span>
        ))}
      </nav>

      {/* Search trigger (Cmd+K) */}
      <button
        type="button"
        onClick={() => {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
          );
        }}
        className="ml-auto flex items-center gap-2 rounded-md border border-token-border bg-token-bg-subtle px-2.5 py-1.5 text-[13px] text-token-muted transition-colors hover:border-token-border-strong hover:bg-token-bg-hover"
        style={{ minWidth: 280 }}
      >
        <Icon name="search" size="sm" className="!text-[14px]" />
        <span className="flex-1 text-left">Ara, gez, çalıştır...</span>
        <kbd className="rounded border border-token-border bg-token-bg-elev px-1 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {onOpenAI && (
          <button
            type="button"
            onClick={onOpenAI}
            title="CRM Asistanı (⌘J)"
            aria-label="CRM Asistanı"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--magenta))',
            }}
          >
            <Icon name="auto_awesome" size="sm" className="!text-[14px]" />
            <span className="hidden lg:inline">Asistan</span>
            <kbd className="ml-0.5 rounded border border-white/30 bg-white/15 px-1 font-mono text-[9px]">
              ⌘J
            </kbd>
          </button>
        )}

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
          className="grid size-8 place-items-center rounded-md text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size="sm" />
        </button>

        <TweaksDropdown />

        <div className="relative">
          <button
            onClick={toggleNotif}
            aria-label={
              unreadCount > 0
                ? `${unreadCount} okunmamış bildirim`
                : 'Bildirimler'
            }
            className={cn(
              'relative grid size-8 place-items-center rounded-md text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text',
              notifOpen && 'bg-token-bg-hover text-token-text',
              unreadCount > 0 && !notifOpen && 'text-token-text',
            )}
          >
            {/* Zil ikonu — yeni geldiginde sallanma origin top-center */}
            <span
              className={cn(
                'inline-block transition-transform',
                ringing && 'origin-top animate-bell-ring',
              )}
            >
              <Icon
                name={unreadCount > 0 ? 'notifications_active' : 'notifications'}
                size="sm"
              />
            </span>

            {/* Yeni geldiginde dis halka pulse */}
            {ringing && (
              <span
                className="pointer-events-none absolute inset-0 rounded-md ring-2 animate-bell-pulse"
                style={{ borderColor: 'var(--magenta)', boxShadow: '0 0 0 2px var(--magenta)' }}
                aria-hidden
              />
            )}

            {/* Sayi badge'i */}
            {unreadCount > 0 && (
              <span
                className={cn(
                  'absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-token-bg-elev',
                  ringing && 'animate-bell-ring origin-bottom',
                )}
                style={{ background: 'var(--magenta)' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={closeNotif} />
        </div>

        <div className="mx-1 h-5 w-px bg-token-border" />

        <div
          className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--magenta), var(--accent))',
          }}
          title={user?.fullName ?? ''}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
