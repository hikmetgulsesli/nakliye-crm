import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { CommandPalette } from '@/components/search/CommandPalette';
import { AIPanel } from '@/components/ai/AIPanel';
import { useFeaturesStore, useFeature } from '@/stores/featuresStore';

export default function AppLayout() {
  const fetchFeatures = useFeaturesStore((s) => s.fetch);
  const cmdKEnabled = useFeature('command_palette');
  const [aiPanelOpen, setAIPanelOpen] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Ctrl/Cmd+J ile AI panel aç/kapa
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAIPanelOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-token-bg">
      {cmdKEnabled && <CommandPalette />}
      <AIPanel open={aiPanelOpen} onClose={() => setAIPanelOpen(false)} />
      <Sidebar />

      <div
        className="flex flex-1 flex-col"
        style={{ marginLeft: 'var(--sidebar-w)' }}
      >
        <Header onOpenAI={() => setAIPanelOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
