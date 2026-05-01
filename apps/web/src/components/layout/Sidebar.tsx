import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Icon } from '@/components/ui';
import api from '@/config/api';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/' },
  { label: 'Müşteriler', icon: 'people', path: '/musteriler' },
  { label: 'Teklifler', icon: 'description', path: '/teklifler' },
  { label: 'Sevkiyatlar', icon: 'local_shipping', path: '/sevkiyatlar' },
  { label: 'Raporlar', icon: 'bar_chart_4_bars', path: '/raporlar', adminOnly: true },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Kullanıcı Yönetimi', icon: 'manage_accounts', path: '/kullanicilar', adminOnly: true },
  { label: 'Liste Yönetimi', icon: 'list', path: '/liste-yonetimi', adminOnly: true },
  { label: 'Sistem Ayarları', icon: 'settings', path: '/ayarlar', adminOnly: true },
  { label: 'Loglar', icon: 'receipt_long', path: '/loglar', adminOnly: true },
];

interface Counts {
  customers: number;
  quotations: number;
  shipments: number;
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const admin = isAdmin();
  const [counts, setCounts] = useState<Counts | null>(null);

  // Hafif sayilar — sidebar'da gostermek icin paginated total'lari cek (page=1, pageSize=1)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, q, s] = await Promise.all([
          api.get<{ total: number }>('/customers', { params: { page: 1, pageSize: 1 } }),
          api.get<{ total: number }>('/quotations', { params: { page: 1, pageSize: 1 } }),
          api.get<{ total: number }>('/shipments', { params: { page: 1, pageSize: 1 } }),
        ]);
        if (cancelled) return;
        setCounts({
          customers: c.data.total ?? 0,
          quotations: q.data.total ?? 0,
          shipments: s.data.total ?? 0,
        });
      } catch {
        // sessizce yut — sidebar bos sayilarla calismaya devam etsin
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredPrimary = PRIMARY_NAV.filter((i) => !i.adminOnly || admin);
  const filteredAdmin = ADMIN_NAV.filter((i) => !i.adminOnly || admin);

  const initials = (user?.fullName ?? 'NC')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function getCount(path: string): number | undefined {
    if (!counts) return undefined;
    if (path === '/musteriler') return counts.customers;
    if (path === '/teklifler') return counts.quotations;
    if (path === '/sevkiyatlar') return counts.shipments;
    return undefined;
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex flex-col overflow-hidden border-r border-token-border bg-token-bg-elev"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 border-b border-token-border px-4"
        style={{ height: 'var(--topbar-h)' }}
      >
        <div
          className="grid size-7 place-items-center rounded-md text-[12px] font-bold text-white shadow-sm"
          style={{
            background:
              'linear-gradient(135deg, var(--accent), var(--magenta))',
            letterSpacing: '-0.02em',
          }}
        >
          N
        </div>
        <div className="flex-1 text-[14px] font-semibold tracking-tight text-token-text">
          NakliyeCRM
        </div>
        <div className="rounded border border-token-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-token-subtle font-mono">
          v1.0
        </div>
      </div>

      {/* Workspace switcher */}
      <button
        type="button"
        className="mx-2.5 mt-2.5 flex items-center gap-2.5 rounded-md border border-token-border bg-token-bg-subtle px-2.5 py-2 transition-colors hover:bg-token-bg-hover"
      >
        <div
          className="grid size-6 place-items-center rounded-md text-[11px] font-semibold text-white"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          {initials.charAt(0)}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[13px] font-medium text-token-text">
            {user?.fullName ?? 'Workspace'}
          </div>
          <div className="text-[11px] text-token-muted">
            {admin ? 'Yönetici · Workspace' : 'Temsilci'}
          </div>
        </div>
        <Icon name="expand_more" size="sm" className="text-token-subtle" />
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
          Çalışma alanı
        </div>
        {filteredPrimary.map((item) => {
          const active = isActive(item.path);
          const count = getCount(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-token-bg-active text-token-text'
                  : 'text-token-muted hover:bg-token-bg-hover hover:text-token-text',
              )}
            >
              {active && (
                <span
                  className="absolute -left-2 top-2 bottom-2 w-0.5 rounded"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <span className="material-symbols-outlined !text-[18px] opacity-90">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {count !== undefined && (
                <span className="font-mono text-[11px] text-token-subtle">{count}</span>
              )}
            </Link>
          );
        })}

        {filteredAdmin.length > 0 && (
          <>
            <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
              Yönetim
            </div>
            {filteredAdmin.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-token-bg-active text-token-text'
                      : 'text-token-muted hover:bg-token-bg-hover hover:text-token-text',
                  )}
                >
                  {active && (
                    <span
                      className="absolute -left-2 top-2 bottom-2 w-0.5 rounded"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                  <span className="material-symbols-outlined !text-[18px] opacity-90">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        {/* Saved views — placeholder; ileride saved_views API'sinden doldurulacak */}
        <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
          Kaydedilen görünümler
        </div>
        <Link
          to="/teklifler?status=Bekliyor"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
        >
          <span className="text-magenta">●</span>
          <span className="flex-1">Bekleyen teklifler</span>
        </Link>
        <Link
          to="/musteriler"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
        >
          <span className="text-warning">●</span>
          <span className="flex-1">Sadece kendi müşterilerim</span>
        </Link>
        <Link
          to="/sevkiyatlar"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
        >
          <span className="text-info">●</span>
          <span className="flex-1">Aktif sevkiyatlar</span>
        </Link>
      </nav>

      {/* Footer: user + logout */}
      <div className="flex items-center gap-2.5 border-t border-token-border px-2.5 py-2.5">
        <button
          onClick={() => navigate('/profil')}
          className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--magenta), var(--accent))',
          }}
          title="Profilim"
        >
          {initials}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-token-text">
            {user?.fullName ?? 'Kullanıcı'}
          </div>
          <div className="truncate text-[11px] text-token-muted">
            {admin ? 'Yönetici' : 'Temsilci'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="grid size-7 place-items-center rounded-md text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
          title="Çıkış"
        >
          <Icon name="logout" size="sm" />
        </button>
      </div>
    </aside>
  );
}
