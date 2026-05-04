import { useEffect, useState } from 'react';
import { Card, Button, Skeleton, Icon } from '@/components/ui';
import { settingsService, type SecretCategoryGroup, type SecretStatus } from '@/services/settings.service';

export function SecretsTab() {
  const [groups, setGroups] = useState<SecretCategoryGroup[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await settingsService.listSecrets();
      setGroups(data.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(name: string, value: string) {
    const updated = await settingsService.updateSecret(name, value);
    if (groups) {
      setGroups(
        groups.map((g) => ({
          ...g,
          items: g.items.map((it) =>
            it.name === updated.name ? { ...it, ...updated } : it,
          ),
        })),
      );
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
        <strong>🔐 Güvenlik:</strong> API key'ler AES-256-GCM ile şifrelenmiş
        saklanır. UI sadece son 4 karakteri gösterir. Aynı değer env'de de
        tanımlıysa <strong>env öncelikli</strong> (production güvenliği).
        Silmek için alanı boş kaydedin.
      </div>

      {groups.map((g) => (
        <Card key={g.category} title={g.label}>
          <div className="space-y-4">
            {g.items.map((it) => (
              <SecretRow key={it.name} secret={it} onSave={handleUpdate} />
            ))}
            {g.category === 'storage' && <StorageConnectionTest />}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StorageConnectionTest() {
  const [state, setState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);

  async function run() {
    setState('testing');
    setMessage('');
    setLatency(null);
    try {
      const res = await settingsService.testStorage();
      if (res.ok) {
        setState('ok');
        setMessage(res.message);
        setLatency(res.detail?.latencyMs ?? null);
      } else {
        setState('error');
        setMessage(res.message);
      }
    } catch (err: unknown) {
      setState('error');
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const apiMsg = e.response?.data?.message;
      const status = e.response?.status;
      if (apiMsg) {
        setMessage(apiMsg);
      } else if (status === 404) {
        setMessage(
          'Endpoint sunucuda yok (HTTP 404). Yeni kod henüz deploy edilmemiş olabilir — Dokploy redeploy yapıp sayfayı sert yenileyin (Ctrl+Shift+R).',
        );
      } else if (status) {
        setMessage(`Sunucu hatası (HTTP ${status}). ${e.message || ''}`.trim());
      } else {
        setMessage(`Bağlantı testi başarısız. ${e.message || 'Bilinmeyen hata'}`);
      }
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Bağlantı Testi
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Yukarıdaki S3/R2 bilgileriyle bucket'a küçük bir test dosyası yazıp okur ve siler.
            Endpoint, bucket adı, anahtarlar doğru mu hızlı kontrol için.
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon="cloud_sync"
          loading={state === 'testing'}
          onClick={run}
        >
          Test Et
        </Button>
      </div>
      {state === 'ok' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <Icon name="check_circle" size="sm" />
          <span>{message}</span>
          {latency != null && (
            <span className="text-xs text-slate-500">({latency} ms)</span>
          )}
        </div>
      )}
      {state === 'error' && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <Icon name="error" size="sm" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function SecretRow({
  secret,
  onSave,
}: {
  secret: SecretStatus;
  onSave: (name: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const fromEnv = secret.source === 'env';

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await onSave(secret.name, value);
      setValue('');
      setEditing(false);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Kaydedilemedi',
      );
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!confirm(`${secret.label} silinsin mi?`)) return;
    setSaving(true);
    try {
      await onSave(secret.name, '');
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {secret.label}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {secret.configured ? (
              <>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  •••• •••• •••• {secret.lastFour}
                </span>
                {fromEnv ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    env: {secret.envVar}
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    UI (şifreli)
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-500">Henüz tanımlanmadı</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!editing && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)} disabled={fromEnv}>
                {secret.configured ? 'Değiştir' : 'Ekle'}
              </Button>
              {secret.configured && !fromEnv && (
                <Button size="sm" variant="secondary" onClick={clear} loading={saving}>
                  Sil
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {fromEnv && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Bu değer sunucu env'inde tanımlı; UI'dan değiştirilemez. Kaldırmak için
          Dokploy / sunucu env'den çıkarın ve restart edin.
        </div>
      )}

      {editing && (
        <div className="mt-3 flex gap-2">
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Yeni ${secret.label}`}
            className="flex-1 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
          />
          <Button variant="primary" size="sm" onClick={submit} loading={saving} disabled={!value}>
            Kaydet
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditing(false);
              setValue('');
              setError(null);
            }}
          >
            Vazgeç
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <Icon name="error" size="sm" /> {error}
        </div>
      )}
      {ok && (
        <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
          <Icon name="check_circle" size="sm" /> Kaydedildi
        </div>
      )}
    </div>
  );
}
