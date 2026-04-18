import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from '@/components/search/CommandPalette';
import { useFeaturesStore, useFeature } from '@/stores/featuresStore';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/musteriler': 'Müşteriler',
  '/musteriler/yeni': 'Yeni Müşteri',
  '/teklifler': 'Teklifler',
  '/teklifler/yeni': 'Yeni Teklif',
  '/sevkiyatlar': 'Sevkiyatlar',
  '/raporlar': 'Raporlar',
  '/kullanicilar': 'Kullanıcı Yönetimi',
  '/liste-yonetimi': 'Liste Yönetimi',
  '/ayarlar': 'Sistem Ayarları',
  '/loglar': 'Loglar',
  '/devir': 'Veri Devir',
  '/profil': 'Profil',
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Check for dynamic routes like /müşteriler/:id
  if (/^\/musteriler\/.+$/.test(pathname)) return 'Müşteri Detay';
  if (/^\/teklifler\/.+$/.test(pathname)) return 'Teklif Detay';

  return 'NakliyeCRM';
}

export default function AppLayout() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);
  const fetchFeatures = useFeaturesStore((s) => s.fetch);
  const cmdKEnabled = useFeature('command_palette');

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return (
    <div className="flex min-h-screen">
      {cmdKEnabled && <CommandPalette />}
      {/* Sidebar - fixed */}
      <Sidebar />

      {/* Main content area */}
      <div className="ml-64 flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-bg-light dark:bg-bg-dark p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
