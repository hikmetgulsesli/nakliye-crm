import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useBrand } from '@/stores/brandStore';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import { useUIStore } from '@/stores/uiStore';
import { Icon } from '@/components/ui';
import api from '@/config/api';
import type { SavedView, SavedViewResource } from '@/services/saved-views.service';

const RESOURCE_PATHS: Record<SavedViewResource, string> = {
  customers: '/musteriler',
  quotations: '/teklifler',
  shipments: '/sevkiyatlar',
  activities: '/aktiviteler',
};

const RESOURCE_DOT: Record<SavedViewResource, string> = {
  customers: 'var(--accent)',
  quotations: 'var(--magenta)',
  shipments: 'var(--info)',
  activities: 'var(--warning)',
};

function viewToHref(view: SavedView): string {
  const base = RESOURCE_PATHS[view.resource];
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(view.filters ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'object') continue;
    params.set(key, String(value));
  }
  // Url marker: hangi saved view aktif (sayfa okuyabilir)
  params.set('view', String(view.id));
  return `${base}?${params.toString()}`;
}

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
  const allSavedViews = useSavedViewsStore((s) => s.all);
  const fetchSavedViewsIfNeeded = useSavedViewsStore((s) => s.fetchIfNeeded);
  const pinnedViews = useMemo(() => allSavedViews.filter((v) => v.isPinned), [allSavedViews]);

  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    fetchSavedViewsIfNeeded();
  }, [fetchSavedViewsIfNeeded]);

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

  function NavLinkRow({ item, count }: { item: NavItem; count?: number }) {
    const active = isActive(item.path);
    return (
      <Link
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
          collapsed && 'justify-center px-1.5',
          active
            ? 'bg-token-bg-active text-token-text'
            : 'text-token-muted hover:bg-token-bg-hover hover:text-token-text',
        )}
      >
        {active && (
          <span
            className={cn(
              'absolute top-2 bottom-2 w-0.5 rounded',
              collapsed ? 'left-0' : '-left-2',
            )}
            style={{ background: 'var(--accent)' }}
          />
        )}
        <span className="material-symbols-outlined !text-[18px] opacity-90">
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {count !== undefined && (
              <span className="font-mono text-[11px] text-token-subtle">{count}</span>
            )}
          </>
        )}
      </Link>
    );
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex flex-col overflow-hidden border-r border-token-border bg-token-bg-elev transition-[width] duration-200"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Brand + collapse toggle */}
      <BrandHeader collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Workspace switcher — collapsed iken yalniz baş harf */}
      {!collapsed ? (
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
      ) : (
        <div
          className="mx-auto mt-2.5 grid size-7 place-items-center rounded-md text-[11px] font-semibold text-white"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          title={user?.fullName ?? 'Workspace'}
        >
          {initials.charAt(0)}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {!collapsed && (
          <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
            Çalışma alanı
          </div>
        )}
        {collapsed && <div className="pt-3" />}
        {filteredPrimary.map((item) => (
          <NavLinkRow key={item.path} item={item} count={getCount(item.path)} />
        ))}

        {filteredAdmin.length > 0 && (
          <>
            {!collapsed ? (
              <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
                Yönetim
              </div>
            ) : (
              <div className="my-2 border-t border-token-border" />
            )}
            {filteredAdmin.map((item) => (
              <NavLinkRow key={item.path} item={item} />
            ))}
          </>
        )}

        {/* Kullanicinin sabitledigi kaydedilmis görünümler */}
        {pinnedViews.length > 0 && !collapsed && (
          <>
            <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-token-subtle">
              Kaydedilen görünümler
            </div>
            {pinnedViews.map((view) => (
              <Link
                key={view.id}
                to={viewToHref(view)}
                title={`${view.name} · ${view.resource}`}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text"
              >
                <span style={{ color: RESOURCE_DOT[view.resource] }}>●</span>
                <span className="flex-1 truncate">{view.name}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer: user + logout */}
      <div
        className={cn(
          'flex items-center gap-2.5 border-t border-token-border py-2.5',
          collapsed ? 'flex-col px-1' : 'px-2.5',
        )}
      >
        <button
          onClick={() => navigate('/profil')}
          className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--magenta), var(--accent))',
          }}
          title={user?.fullName ?? 'Profilim'}
        >
          {initials}
        </button>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-token-text">
              {user?.fullName ?? 'Kullanıcı'}
            </div>
            <div className="truncate text-[11px] text-token-muted">
              {admin ? 'Yönetici' : 'Temsilci'}
            </div>
          </div>
        )}
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

function BrandHeader({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const brand = useBrand();
  const initial = (brand.companyName || 'N').trim().charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 border-b border-token-border',
        collapsed ? 'justify-center px-1' : 'px-4',
      )}
      style={{ height: 'var(--topbar-h)' }}
    >
      {!collapsed && (
        <>
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.companyName}
              className="h-7 max-w-[110px] object-contain"
            />
          ) : (
            <>
              <div
                className="grid size-7 place-items-center rounded-md text-[12px] font-bold text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--magenta))',
                  letterSpacing: '-0.02em',
                }}
              >
                {initial}
              </div>
              <div className="flex-1 truncate text-[14px] font-semibold tracking-tight text-token-text">
                {brand.companyName}
              </div>
            </>
          )}
        </>
      )}
      {collapsed && (
        <div
          className="grid size-7 place-items-center rounded-md text-[12px] font-bold text-white shadow-sm"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--magenta))',
          }}
          title={brand.companyName}
        >
          {initial}
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'grid size-7 place-items-center rounded-md text-token-muted transition-colors hover:bg-token-bg-hover hover:text-token-text',
          collapsed && 'absolute right-1 top-1.5',
        )}
        title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
      >
        <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size="sm" />
      </button>
    </div>
  );
}
