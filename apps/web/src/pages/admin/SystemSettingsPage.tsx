import { useEffect, useState } from 'react';
import { Card, Tabs, Button, Skeleton, Badge, Select } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { settingsService, type SettingsResponse, type AIUsageReport } from '@/services/settings.service';
import { emailsService } from '@/services/emails.service';
import { FeaturesTab } from './FeaturesTab';
import { SecretsTab } from './SecretsTab';
import { BrandTab } from './BrandTab';
import { AIConnectionTest } from '@/components/admin/AIConnectionTest';

type TabKey = 'features' | 'brand' | 'general' | 'ai' | 'secrets' | 'integrations' | 'notifications' | 'usage';

const TABS = [
  { key: 'features', label: 'Özellikler' },
  { key: 'brand', label: 'Marka' },
  { key: 'general', label: 'Genel' },
  { key: 'ai', label: 'AI Sağlayıcılar' },
  { key: 'secrets', label: 'API Anahtarları' },
  { key: 'integrations', label: 'Entegrasyonlar' },
  { key: 'notifications', label: 'Bildirim Kuralları' },
  { key: 'usage', label: 'AI Kullanım' },
] as const;

export default function SystemSettingsPage() {
  const [active, setActive] = useState<TabKey>('features');
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [usage, setUsage] = useState<AIUsageReport | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await settingsService.getAll();
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (active === 'usage' && !usage) {
      settingsService.aiUsage(30).then(setUsage).catch(() => setUsage(null));
    }
  }, [active, usage]);

  async function save(key: string, value: unknown) {
    setSaving(key);
    try {
      await settingsService.update(key, value);
      if (data) {
        setData({
          ...data,
          settings: { ...data.settings, [key]: value },
        });
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sistem Ayarları' },
        ]}
        title="Sistem Ayarları"
      />

      <div className="mb-6">
        <Tabs
          tabs={TABS as unknown as { key: string; label: string }[]}
          activeTab={active}
          onChange={(k) => setActive(k as TabKey)}
        />
      </div>

      {active === 'features' ? (
        <FeaturesTab />
      ) : active === 'brand' ? (
        <BrandTab />
      ) : active === 'secrets' ? (
        <SecretsTab />
      ) : loading && !data ? (
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : !data ? (
        <Card>
          <p className="text-slate-500 dark:text-slate-400">Ayarlar yüklenemedi.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {active === 'general' && <GeneralTab data={data} save={save} saving={saving} />}
          {active === 'ai' && <AITab data={data} save={save} saving={saving} />}
          {active === 'integrations' && <IntegrationsTab data={data} />}
          {active === 'notifications' && (
            <NotificationsTab data={data} save={save} saving={saving} />
          )}
          {active === 'usage' && <UsageTab usage={usage} />}
        </div>
      )}
    </div>
  );
}

// ---------------- Tab: General ----------------

interface TabProps {
  data: SettingsResponse;
  save: (key: string, value: unknown) => Promise<void>;
  saving: string | null;
}

function GeneralTab({ data, save, saving }: TabProps) {
  const notifEnabled = data.settings['notifications.enabled'] !== false;
  const emailEnabled = data.settings['email.enabled'] === true;
  const dailyDigestEnabled = data.settings['email.daily_digest'] === true;
  const redisEnabled = data.settings['infrastructure.redis_enabled'] !== false;
  const imapEnabled = data.settings['imap.enabled'] === true;
  const emailAvailable =
    data.integrations.email.resendConfigured || data.integrations.email.smtpConfigured;

  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState<string>('');

  async function handleTestEmail() {
    setTestState('sending');
    setTestMsg('');
    try {
      const res = await emailsService.sendTest();
      setTestState('sent');
      setTestMsg(`Gönderildi (${res.provider})`);
      setTimeout(() => setTestState('idle'), 5000);
    } catch (err: unknown) {
      setTestState('error');
      setTestMsg((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hata oluştu');
    }
  }

  return (
    <>
      <Card title="Altyapı">
        <ToggleRow
          label="Redis / BullMQ"
          description="Arka plan iş kuyruğu (bildirimler, e-posta, TCMB, IMAP, AI cron). Kapatılırsa sistem in-process setInterval'a düşer — Redis yoksa bu önerilir."
          enabled={redisEnabled}
          onChange={(v) => save('infrastructure.redis_enabled', v)}
          saving={saving === 'infrastructure.redis_enabled'}
        />
        <ToggleRow
          label="IMAP Senkronizasyonu"
          description="Her 5 dakikada bir mail kutusundan gelen mesajları müşteri kartına bağlar. Redis + IMAP credentials gerekir."
          enabled={imapEnabled}
          onChange={(v) => save('imap.enabled', v)}
          saving={saving === 'imap.enabled'}
          disabled={!redisEnabled}
          disabledHint={!redisEnabled ? 'Önce Redis açık olmalı.' : undefined}
        />
      </Card>

      <Card title="Bildirimler">
        <ToggleRow
          label="Bildirim Scheduler"
          description="Otomatik bildirim üretimi (14 gün aranmayan müşteri, süresi dolmuş teklif vb.). Kapatılırsa cron çalışmaz."
          enabled={notifEnabled}
          onChange={(v) => save('notifications.enabled', v)}
          saving={saving === 'notifications.enabled'}
        />
      </Card>

      <Card title="E-posta">
        <ToggleRow
          label="E-posta Gönderimi"
          description="Transactional e-posta (Resend/SMTP). Kapatılırsa günlük özet ve kritik uyarı gönderilmez."
          enabled={emailEnabled}
          onChange={(v) => save('email.enabled', v)}
          saving={saving === 'email.enabled'}
          disabled={!emailAvailable}
          disabledHint="Env'de RESEND_API_KEY veya SMTP_HOST ayarlanmadı."
        />
        <ToggleRow
          label="Günlük Özet E-postası"
          description="Her sabah 09:00'da admin'lere son 24 saatin özeti gönderilir."
          enabled={dailyDigestEnabled}
          onChange={(v) => save('email.daily_digest', v)}
          saving={saving === 'email.daily_digest'}
          disabled={!emailEnabled || !emailAvailable}
          disabledHint={!emailEnabled ? 'Önce E-posta Gönderimi aktif edin.' : undefined}
        />
        <div className="flex items-center gap-3 pt-4">
          <Button
            variant="secondary"
            size="sm"
            icon="send"
            onClick={handleTestEmail}
            loading={testState === 'sending'}
            disabled={!emailAvailable}
          >
            Test E-postası Gönder
          </Button>
          {testState === 'sent' && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ {testMsg}</span>
          )}
          {testState === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400">✗ {testMsg}</span>
          )}
        </div>
      </Card>
    </>
  );
}

// ---------------- Tab: AI ----------------

const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI (GPT)',
  minimax: 'MiniMax',
  kimi: 'Kimi (Moonshot)',
  groq: 'Groq (LPU)',
};

function AITab({ data, save, saving }: TabProps) {
  const aiEnabled = data.settings['ai.enabled'] === true;
  const defaultProvider = (data.settings['ai.default.provider'] as string) || '';

  const configured = data.aiProviders.filter((p) => p.configured);

  return (
    <>
      <Card title="AI Genel">
        <div className="space-y-4">
          <ToggleRow
            label="AI Özellikleri"
            description="Teklif e-posta taslağı, kazanma ihtimali, kaybetme riski ve koçluk önerileri. Kapatılırsa AI çağrıları yapılmaz."
            enabled={aiEnabled}
            onChange={(v) => save('ai.enabled', v)}
            saving={saving === 'ai.enabled'}
            disabled={configured.length === 0}
            disabledHint="Hiçbir sağlayıcı yapılandırılmamış. Yan taraftaki 'API Anahtarları' tabından ekleyin."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectSetting
              label="Varsayılan Sağlayıcı"
              value={defaultProvider}
              options={[
                { value: '', label: '— Sistem varsayılanı (env AI_PROVIDER) —' },
                ...configured.map((p) => ({
                  value: p.name,
                  label: PROVIDER_LABELS[p.name],
                })),
              ]}
              onChange={(v) => save('ai.default.provider', v || null)}
              saving={saving === 'ai.default.provider'}
            />
          </div>

          <AIConnectionTest disabled={configured.length === 0 || !aiEnabled} />
        </div>
      </Card>

      <Card title="Sağlayıcı Durumu">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.aiProviders.map((p) => (
            <div
              key={p.name}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {PROVIDER_LABELS[p.name]}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Model: <code className="text-xs">{p.defaultModel}</code>
                </div>
              </div>
              <div className="text-right">
                {p.configured ? (
                  <>
                    <Badge variant="success">Yapılandırılmış</Badge>
                    {p.lastFour && (
                      <div className="text-xs font-mono text-slate-500 mt-1">
                        •••• {p.lastFour} ({p.source === 'env' ? 'env' : 'UI'})
                      </div>
                    )}
                  </>
                ) : (
                  <Badge variant="neutral">Yapılandırılmamış</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          🔐 API key'leri "API Anahtarları" tabından güvenli şekilde (AES-256 şifreli)
          ekleyebilir, veya sunucu env'den tanımlayabilirsiniz. Env öncelikli çalışır.
        </p>
      </Card>

      <Card title="Görev Bazlı Sağlayıcı Override">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Belirli görevleri farklı sağlayıcıya yönlendirin (örn. uzun
          dökümanlar için Kimi, hızlı draft için MiniMax).
        </p>
        <div className="space-y-3">
          <TaskOverrideRow
            taskKey="ai.task.draft-email.provider"
            label="Teklif E-posta Taslağı"
            value={(data.settings['ai.task.draft-email.provider'] as string) || ''}
            providers={configured}
            save={save}
            saving={saving}
          />
          <TaskOverrideRow
            taskKey="ai.task.win-probability.provider"
            label="Kazanma İhtimali"
            value={(data.settings['ai.task.win-probability.provider'] as string) || ''}
            providers={configured}
            save={save}
            saving={saving}
          />
          <TaskOverrideRow
            taskKey="ai.task.churn-risk.provider"
            label="Müşteri Kaybetme Riski"
            value={(data.settings['ai.task.churn-risk.provider'] as string) || ''}
            providers={configured}
            save={save}
            saving={saving}
          />
          <TaskOverrideRow
            taskKey="ai.task.coaching.provider"
            label="Personel Koçluk Önerileri"
            value={(data.settings['ai.task.coaching.provider'] as string) || ''}
            providers={configured}
            save={save}
            saving={saving}
          />
        </div>
      </Card>
    </>
  );
}

interface TaskOverrideRowProps {
  taskKey: string;
  label: string;
  value: string;
  providers: { name: string }[];
  save: (key: string, value: unknown) => Promise<void>;
  saving: string | null;
}

function TaskOverrideRow({ taskKey, label, value, providers, save, saving }: TaskOverrideRowProps) {
  const options = [
    { value: '', label: 'Varsayılan' },
    ...providers.map((p) => ({ value: p.name, label: PROVIDER_LABELS[p.name] })),
  ];
  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</div>
      <div className="w-64">
        <Select
          value={value}
          onChange={(e) => save(taskKey, e.target.value || null)}
          disabled={saving === taskKey}
          options={options}
        />
      </div>
    </div>
  );
}

// ---------------- Tab: Integrations ----------------

function IntegrationsTab({ data }: { data: SettingsResponse }) {
  const { integrations } = data;
  return (
    <>
      <Card title="İzleme & Gözlemlenebilirlik">
        <IntegrationRow
          name="Sentry (backend)"
          description="Hata izleme + stack trace. Env: SENTRY_DSN"
          configured={integrations.sentry.backend}
        />
      </Card>

      <Card title="Altyapı">
        <IntegrationRow
          name="Redis + BullMQ"
          description={
            integrations.redis.enabled === false
              ? 'Kapalı (in-process fallback). Genel tabından açabilirsiniz.'
              : `Aktif. ${integrations.redis.url || 'env REDIS_URL'}`
          }
          configured={integrations.redis.enabled !== false}
        />
        <IntegrationRow
          name="Object Storage (R2/S3)"
          description={`Doküman ve avatar saklama. Env: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY${integrations.storage.bucket ? ` (bucket: ${integrations.storage.bucket})` : ''}`}
          configured={integrations.storage.configured}
        />
      </Card>

      <Card title="İletişim Kanalları">
        <IntegrationRow
          name="Resend (transactional e-posta)"
          description="Env: RESEND_API_KEY. Alternatif: SMTP_HOST"
          configured={integrations.email.resendConfigured || integrations.email.smtpConfigured}
        />
        <IntegrationRow
          name="WhatsApp Business (Twilio)"
          description="Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN"
          configured={integrations.whatsapp.twilioConfigured}
        />
        <IntegrationRow
          name="SMS (Netgsm)"
          description="Env: NETGSM_USER, NETGSM_PASSWORD"
          configured={integrations.sms.netgsmConfigured}
        />
      </Card>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Hassas değerler (API key, DSN, credentials) UI'dan değiştirilmez — sunucu env'den okunur.
        Dokploy Environment sekmesinden ekleyin, container yeniden başlatın.
      </p>
    </>
  );
}

// ---------------- Tab: Notifications ----------------

function NotificationsTab({ data, save, saving }: TabProps) {
  const notifEnabled = data.settings['notifications.enabled'] !== false;
  const uncontactedDays = (data.settings['notifications.uncontacted_days'] as number) || 14;
  const pendingDays = (data.settings['notifications.pending_quote_days'] as number) || 7;
  const highPotentialDays = (data.settings['notifications.high_potential_days'] as number) || 30;

  return (
    <Card title="Bildirim Eşik Değerleri">
      <div className="space-y-4">
        <ToggleRow
          label="Scheduler Aktif"
          description="Otomatik bildirim cron'u (60 dk'da bir çalışır)."
          enabled={notifEnabled}
          onChange={(v) => save('notifications.enabled', v)}
          saving={saving === 'notifications.enabled'}
        />

        <NumberInputRow
          label="Aranmayan Müşteri Eşiği (gün)"
          description="Son aktivite üzerinden bu kadar gün geçmişse 'Aranmayan Müşteri' uyarısı üretilir."
          value={uncontactedDays}
          min={1}
          max={90}
          onChange={(v) => save('notifications.uncontacted_days', v)}
          saving={saving === 'notifications.uncontacted_days'}
        />
        <NumberInputRow
          label="Bekleyen Teklif Eşiği (gün)"
          description="Durumu 'Bekliyor' olan teklifler bu günden fazla bekliyorsa uyarı."
          value={pendingDays}
          min={1}
          max={60}
          onChange={(v) => save('notifications.pending_quote_days', v)}
          saving={saving === 'notifications.pending_quote_days'}
        />
        <NumberInputRow
          label="Yüksek Potansiyel (Teklif Yok) Eşiği (gün)"
          description="Yüksek potansiyel müşterinin bu günden uzun süre teklifi yoksa uyarı."
          value={highPotentialDays}
          min={7}
          max={180}
          onChange={(v) => save('notifications.high_potential_days', v)}
          saving={saving === 'notifications.high_potential_days'}
        />
      </div>
    </Card>
  );
}

// ---------------- Tab: Usage ----------------

function UsageTab({ usage }: { usage: AIUsageReport | null }) {
  if (!usage) {
    return (
      <Card>
        <Skeleton variant="text" className="w-48" />
      </Card>
    );
  }
  return (
    <>
      <Card title="Son 30 Gün">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Toplam Çağrı" value={usage.totals.calls.toString()} />
          <StatBox label="Toplam Token" value={usage.totals.tokens.toLocaleString('tr-TR')} />
          <StatBox
            label="Toplam Maliyet"
            value={`$${usage.totals.costUsd.toFixed(4)}`}
            highlight
          />
        </div>
      </Card>

      <Card title="Sağlayıcı Bazında">
        {usage.byProvider.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Henüz AI çağrısı yapılmamış.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400 text-left">
              <tr>
                <th className="py-2">Sağlayıcı</th>
                <th className="py-2">Çağrı</th>
                <th className="py-2">Token</th>
                <th className="py-2 text-right">Maliyet (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usage.byProvider.map((p) => (
                <tr key={p.provider}>
                  <td className="py-2 font-medium">{PROVIDER_LABELS[p.provider] || p.provider}</td>
                  <td className="py-2">{p._count._all}</td>
                  <td className="py-2">{(p._sum.totalTokens ?? 0).toLocaleString('tr-TR')}</td>
                  <td className="py-2 text-right">${(p._sum.costUsd ?? 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Son Çağrılar">
        {usage.recent.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kayıt yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400 text-left">
              <tr>
                <th className="py-2">Tarih</th>
                <th className="py-2">Sağlayıcı / Model</th>
                <th className="py-2">Görev</th>
                <th className="py-2">Token</th>
                <th className="py-2">Latency</th>
                <th className="py-2 text-right">Maliyet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usage.recent.slice(0, 15).map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-xs">
                    {new Date(r.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2">
                    <span className="font-medium">{r.provider}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({r.model})</span>
                  </td>
                  <td className="py-2 text-xs">{r.task || '-'}</td>
                  <td className="py-2">{r.totalTokens.toLocaleString('tr-TR')}</td>
                  <td className="py-2 text-xs">{r.latencyMs}ms</td>
                  <td className="py-2 text-right">${r.costUsd.toFixed(5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

// ---------------- Shared widgets ----------------

interface ToggleRowProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
  disabled?: boolean;
  disabledHint?: string;
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
  saving,
  disabled,
  disabledHint,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</div>
        )}
        {disabled && disabledHint && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            {disabledHint}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && !saving && onChange(!enabled)}
        disabled={disabled || saving}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
          enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
          disabled || saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block size-5 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

function IntegrationRow({
  name,
  description,
  configured,
}: {
  name: string;
  description: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{name}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</div>
      </div>
      {configured ? (
        <Badge variant="success">Aktif</Badge>
      ) : (
        <Badge variant="neutral">Pasif</Badge>
      )}
    </div>
  );
}

interface NumberInputRowProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  saving?: boolean;
}

function NumberInputRow({
  label,
  description,
  value,
  min,
  max,
  onChange,
  saving,
}: NumberInputRowProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={local}
          min={min}
          max={max}
          onChange={(e) => setLocal(Number(e.target.value))}
          className="w-24 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange(local)}
          loading={saving}
          disabled={local === value}
        >
          Kaydet
        </Button>
      </div>
    </div>
  );
}

function SelectSetting({
  label,
  value,
  options,
  onChange,
  saving,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  saving?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        options={options}
      />
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={[
        'rounded-xl p-4 border',
        highlight
          ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
          : 'border-slate-200 dark:border-slate-700',
      ].join(' ')}
    >
      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={[
          'mt-2 text-2xl font-semibold',
          highlight ? 'text-primary dark:text-primary-300' : 'text-slate-900 dark:text-slate-100',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  );
}
