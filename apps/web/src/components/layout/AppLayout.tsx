import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from '@/components/search/CommandPalette';
import { useFeaturesStore, useFeature } from '@/stores/featuresStore';

export default function AppLayout() {
  const fetchFeatures = useFeaturesStore((s) => s.fetch);
  const cmdKEnabled = useFeature('command_palette');

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return (
    <div className="flex min-h-screen bg-token-bg">
      {cmdKEnabled && <CommandPalette />}
      <Sidebar />

      <div
        className="flex flex-1 flex-col"
        style={{ marginLeft: 'var(--sidebar-w)' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
