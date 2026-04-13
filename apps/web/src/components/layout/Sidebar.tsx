import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/' },
  { label: 'Musteriler', icon: 'people', path: '/musteriler' },
  { label: 'Teklifler', icon: 'description', path: '/teklifler' },
  { label: 'Raporlar', icon: 'bar_chart_4_bars', path: '/raporlar', adminOnly: true },
  { label: 'Kullanici Yonetimi', icon: 'manage_accounts', path: '/kullanicilar', adminOnly: true },
  { label: 'Sistem Ayarlari', icon: 'settings', path: '/liste-yonetimi', adminOnly: true },
  { label: 'Loglar', icon: 'receipt_long', path: '/loglar', adminOnly: true },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const admin = isAdmin();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter((item) => !item.adminOnly || admin);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-[#0f172a] text-slate-300">
      {/* Logo Section */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <span className="material-symbols-outlined text-white">local_shipping</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">NakliyeCRM</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Lojistik Yonetimi
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {filteredItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors',
                active
                  ? 'bg-primary/20 font-medium text-white'
                  : 'text-slate-300 hover:bg-slate-800',
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-800/50 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {user?.fullName
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.fullName || 'Kullanici'}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title="Cikis Yap"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
