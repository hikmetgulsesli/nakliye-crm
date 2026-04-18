import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@/components/ui';
import { settingsService, type FeatureCategoryGroup } from '@/services/settings.service';
import { useFeaturesStore } from '@/stores/featuresStore';

export function FeaturesTab() {
  const [groups, setGroups] = useState<FeatureCategoryGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const refetchFlags = useFeaturesStore((s) => s.fetch);

  async function load() {
    setLoading(true);
    try {
      const data = await settingsService.listFeatures();
      setGroups(data.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(key: string, next: boolean) {
    setSaving(key);
    try {
      await settingsService.update(`features.${key}`, next);
      // Optimistic UI + global feature store'u yenile
      if (groups) {
        setGroups(
          groups.map((g) => ({
            ...g,
            items: g.items.map((it) => (it.key === key ? { ...it, enabled: next } : it)),
          })),
        );
      }
      await refetchFlags();
    } finally {
      setSaving(null);
    }
  }

  if (loading && !groups) {
    return (
      <Card>
        <Skeleton variant="card" />
      </Card>
    );
  }

  if (!groups) return null;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
        <strong>💡 Özellik kontrolü:</strong> Burada kapattığınız modüller tüm
        ekipten gizlenir. API endpoint'leri 403 döner, UI bileşenleri
        render edilmez. İstediğiniz zaman açabilirsiniz.
      </div>

      {groups.map((g) => (
        <Card key={g.category} title={g.label}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {g.items.map((it) => (
              <div
                key={it.key}
                className="flex items-start justify-between gap-6 py-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {it.label}
                  </div>
                  {it.default === false && !it.enabled && (
                    <div className="mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Varsayılan kapalı
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={it.enabled}
                  onClick={() => toggle(it.key, !it.enabled)}
                  disabled={saving === it.key}
                  className={[
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                    it.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
                    saving === it.key ? 'opacity-50 cursor-wait' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'inline-block size-5 rounded-full bg-white shadow transition-transform',
                      it.enabled ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
