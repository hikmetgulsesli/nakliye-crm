import { useEffect, useRef, useState } from 'react';
import { Card, Button, Icon } from '@/components/ui';
import { useBrand, useBrandStore } from '@/stores/brandStore';

const PRESET_COLORS = [
  '#2563eb', // mavi (default)
  '#0ea5e9', // gök
  '#10b981', // emerald
  '#16a34a', // yeşil
  '#f59e0b', // turuncu
  '#dc2626', // kırmızı
  '#a855f7', // mor
  '#ec4899', // pembe
  '#0f172a', // antrasit
];

export function BrandTab() {
  const brand = useBrand();
  const update = useBrandStore((s) => s.update);
  const requestAssetUpload = useBrandStore((s) => s.requestAssetUpload);
  const confirmAsset = useBrandStore((s) => s.confirmAsset);
  const applyTheme = useBrandStore((s) => s.applyTheme);

  const [companyName, setCompanyName] = useState(brand.companyName);
  const [tagline, setTagline] = useState(brand.tagline);
  const [emailFromName, setEmailFromName] = useState(brand.emailFromName);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // brand store guncellendiginde input'lari da yenile
  useEffect(() => {
    setCompanyName(brand.companyName);
    setTagline(brand.tagline);
    setEmailFromName(brand.emailFromName);
    setPrimaryColor(brand.primaryColor);
  }, [brand]);

  // Renk degisikliginde anlik temayi guncelle (kaydet'ten once de gor)
  function pickColor(c: string) {
    setPrimaryColor(c);
    applyTheme(c);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await update({ companyName, tagline, emailFromName, primaryColor });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Kaydedilemedi',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
        <strong>🎨 Marka:</strong> Logo + ana renk + firma adı tüm sistemde
        (header, login, e-posta, PDF rapor) yansır. Logo yüklemek için
        <strong> Sistem Ayarları → API Anahtarları</strong> kısmında S3/R2 ayarlarınızın
        yapılı olması gerekir (ücretsiz Cloudflare R2 önerilir).
      </div>

      <Card title="Firma Bilgileri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Firma Adı">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={60}
              className={inputClass}
              placeholder="örn. X Lojistik A.Ş."
            />
            <p className="text-xs text-slate-500 mt-1">
              Header, login, page title, e-posta imzası gibi tüm yerlerde gözükür.
            </p>
          </Field>
          <Field label="Slogan / Açıklama">
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={120}
              className={inputClass}
              placeholder="örn. Uluslararası Nakliye & Lojistik"
            />
          </Field>
          <Field label="E-posta Gönderici Adı">
            <input
              type="text"
              value={emailFromName}
              onChange={(e) => setEmailFromName(e.target.value)}
              maxLength={60}
              className={inputClass}
              placeholder="örn. X Lojistik"
            />
            <p className="text-xs text-slate-500 mt-1">
              Otomatik e-postalarda "Kimden" satırında görünecek isim.
            </p>
          </Field>
        </div>
      </Card>

      <Card title="Ana Renk">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => pickColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
            aria-label="Özel renk seç"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => {
              const v = e.target.value;
              setPrimaryColor(v);
              if (/^#[0-9a-fA-F]{6}$/.test(v)) applyTheme(v);
            }}
            className={`${inputClass} w-28 font-mono uppercase`}
            placeholder="#1976d2"
            maxLength={7}
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickColor(c)}
                className={`size-8 rounded-full ring-2 transition-transform hover:scale-110 ${
                  c.toLowerCase() === primaryColor.toLowerCase()
                    ? 'ring-slate-900 dark:ring-white'
                    : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Renk ${c}`}
                title={c}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Buton, link, badge, aktif sekme rengi gibi her yer bu renge bağlanır.
          Henüz kaydetmedin — değişikliği görmek için sayfayı dolaş, beğenmezsen
          başka bir renge geç.
        </p>
      </Card>

      <Card title="Logo & Favicon">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AssetUploader
            label="Logo (açık tema)"
            currentUrl={brand.logoUrl}
            type="logo"
            requestAssetUpload={requestAssetUpload}
            confirmAsset={confirmAsset}
            recommendedHint="Önerilen: 240×60 px, PNG/SVG, şeffaf zemin"
          />
          <AssetUploader
            label="Logo (koyu tema)"
            currentUrl={brand.logoDarkUrl}
            type="logoDark"
            requestAssetUpload={requestAssetUpload}
            confirmAsset={confirmAsset}
            recommendedHint="Açık temadakiyle aynı boy, beyaz ya da açık ton"
          />
          <AssetUploader
            label="Favicon"
            currentUrl={brand.faviconUrl}
            type="favicon"
            requestAssetUpload={requestAssetUpload}
            confirmAsset={confirmAsset}
            recommendedHint="32×32 ya da 64×64 PNG/ICO"
          />
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 shadow-lg">
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        {savedAt && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <Icon name="check_circle" size="sm" /> Kaydedildi
          </span>
        )}
        <Button variant="primary" icon="save" onClick={handleSave} loading={saving}>
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
}

const inputClass =
  'block w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

interface AssetUploaderProps {
  label: string;
  currentUrl: string | null;
  type: 'logo' | 'logoDark' | 'favicon';
  recommendedHint?: string;
  requestAssetUpload: (
    type: 'logo' | 'logoDark' | 'favicon',
    filename: string,
    contentType: string,
  ) => Promise<{ key: string; uploadUrl: string; method: 'PUT' }>;
  confirmAsset: (type: 'logo' | 'logoDark' | 'favicon', key: string | null) => Promise<void>;
}

function AssetUploader({
  label,
  currentUrl,
  type,
  recommendedHint,
  requestAssetUpload,
  confirmAsset,
}: AssetUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setErr(null);
    let stage = 'upload-url';
    try {
      const { key, uploadUrl } = await requestAssetUpload(type, file.name, file.type);

      stage = 'r2-put';
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        const body = await putRes.text().catch(() => '');
        throw new Error(
          `R2'ye yükleme reddedildi (HTTP ${putRes.status}). ${body.slice(0, 200)}`,
        );
      }

      stage = 'confirm';
      await confirmAsset(type, key);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; message?: string };
      const status = err.response?.status;
      let prefix = '';
      if (stage === 'upload-url') {
        prefix = status === 404 ? '[Backend yok — Redeploy gerekli] ' : '[Yükleme adresi alınamadı] ';
      } else if (stage === 'r2-put') {
        prefix = '[R2 yazma reddedildi] ';
      } else if (stage === 'confirm') {
        prefix = status === 404 ? '[Backend yok — Redeploy gerekli] ' : '[Kayıt onaylanamadı] ';
      }
      setErr(prefix + (err.message || 'Yükleme hatası'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleClear() {
    setBusy(true);
    setErr(null);
    try {
      await confirmAsset(type, null);
    } catch (e: unknown) {
      setErr((e as Error).message || 'Silme hatası');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
        {label}
      </div>
      <div className="aspect-[3/1] rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center mb-3 overflow-hidden">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={label}
            className="max-h-full max-w-full object-contain p-2"
          />
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            henüz yüklenmedi
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="upload"
          loading={busy}
          onClick={() => fileRef.current?.click()}
        >
          {currentUrl ? 'Değiştir' : 'Yükle'}
        </Button>
        {currentUrl && (
          <Button variant="secondary" size="sm" icon="delete" onClick={handleClear} disabled={busy}>
            Kaldır
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {recommendedHint && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">{recommendedHint}</p>
      )}
      {err && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{err}</p>}
    </div>
  );
}
