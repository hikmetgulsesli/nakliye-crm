import { useEffect, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import type { SavedViewResource } from '@/services/saved-views.service';

interface SaveViewModalProps {
  open: boolean;
  onClose: () => void;
  resource: SavedViewResource;
  /** Şu anki filtre kombinasyonu — JSON olarak saklanır */
  filters: Record<string, unknown>;
  onSaved?: (id: number) => void;
}

/**
 * "Bu görünümü kaydet" — kullanıcının mevcut filtre durumunu adlandırıp
 * kaydetmesini sağlar. Sidebar'a sabitlenmesi opsiyonel.
 */
export function SaveViewModal({ open, onClose, resource, filters, onSaved }: SaveViewModalProps) {
  const add = useSavedViewsStore((s) => s.add);
  const [name, setName] = useState('');
  const [pinned, setPinned] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setPinned(true);
      setError(null);
    }
  }, [open]);

  async function handleSave() {
    if (!name.trim()) {
      setError('İsim zorunludur.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await add({ name: name.trim(), resource, filters, isPinned: pinned });
      onSaved?.(created.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  const filterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== null,
  ).length;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Görünümü kaydet"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-token-text">Görünüm adı</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) handleSave();
            }}
            placeholder="Örn. Yüksek değerli müşteriler"
            className="h-11 w-full rounded-md border border-token-border bg-token-bg-elev px-3 text-sm text-token-text placeholder-token-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-md bg-token-bg-subtle px-3 py-2.5 text-sm text-token-text">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="size-4 rounded border-token-border text-primary focus:ring-2 focus:ring-primary/40"
          />
          <span className="flex-1">Sol menüye sabitle</span>
          <span className="text-[11px] text-token-subtle">İstersen sonra kaldırırsın</span>
        </label>

        <div className="rounded-md border border-token-border bg-token-bg-subtle px-3 py-2 text-xs text-token-muted">
          <div className="font-medium text-token-text">
            {filterCount === 0
              ? 'Hiçbir filtre seçilmedi'
              : `${filterCount} aktif filtre kaydedilecek`}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
