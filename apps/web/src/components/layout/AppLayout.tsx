import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/musteriler': 'Musteriler',
  '/musteriler/yeni': 'Yeni Musteri',
  '/teklifler': 'Teklifler',
  '/teklifler/yeni': 'Yeni Teklif',
  '/raporlar': 'Raporlar',
  '/kullanicilar': 'Kullanici Yonetimi',
  '/liste-yonetimi': 'Sistem Ayarlari',
  '/loglar': 'Loglar',
  '/devir': 'Veri Devir',
  '/profil': 'Profil',
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Check for dynamic routes like /musteriler/:id
  if (/^\/musteriler\/.+$/.test(pathname)) return 'Musteri Detay';
  if (/^\/teklifler\/.+$/.test(pathname)) return 'Teklif Detay';

  return 'NakliyeCRM';
}

export default function AppLayout() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - fixed */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-64 flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-bg-light p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
