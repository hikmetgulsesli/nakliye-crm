import { Request, Response } from 'express';
import { getManySettings, setSetting } from '../../services/system-settings.service';
import { presignDownload, presignUpload, buildKey, isStorageConfigured } from '../../services/storage.service';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';

/**
 * Brand & white-label ayarlari. Logo / renk / firma adi gibi degerler
 * SystemSetting altinda 'brand.*' anahtarlariyla saklanir; herkes (login
 * oncesi de) okuyabilir, sadece ADMIN yazabilir.
 */

export const BRAND_KEYS = {
  companyName: 'brand.company_name',
  tagline: 'brand.tagline',
  primaryColor: 'brand.primary_color',
  logoKey: 'brand.logo_storage_key',
  logoDarkKey: 'brand.logo_dark_storage_key',
  faviconKey: 'brand.favicon_storage_key',
  emailFromName: 'brand.email_from_name',
} as const;

const DEFAULTS = {
  companyName: 'NakliyeCRM',
  tagline: 'Nakliye Operasyon Yönetimi',
  primaryColor: '#2563eb', // Tailwind blue-600 — onceki primary ile uyumlu
  emailFromName: 'NakliyeCRM',
} as const;

export interface BrandPayload {
  companyName: string;
  tagline: string;
  primaryColor: string;
  emailFromName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
}

async function buildBrand(): Promise<BrandPayload> {
  const values = await getManySettings(Object.values(BRAND_KEYS) as string[]);
  const logoKey = values[BRAND_KEYS.logoKey] as string | undefined;
  const logoDarkKey = values[BRAND_KEYS.logoDarkKey] as string | undefined;
  const faviconKey = values[BRAND_KEYS.faviconKey] as string | undefined;

  // Storage yapilandirilmamissa logo URL'leri bos kalir; varsayilanlara duser
  const storageOn = await isStorageConfigured();

  async function safePresign(key?: string): Promise<string | null> {
    if (!key || !storageOn) return null;
    try {
      // Logo'yu uzun sure cache'lenebilir tut; 7 gunluk presign yeterli
      return await presignDownload({ key, expiresIn: 7 * 24 * 3600 });
    } catch {
      return null;
    }
  }

  return {
    companyName: (values[BRAND_KEYS.companyName] as string) || DEFAULTS.companyName,
    tagline: (values[BRAND_KEYS.tagline] as string) || DEFAULTS.tagline,
    primaryColor: (values[BRAND_KEYS.primaryColor] as string) || DEFAULTS.primaryColor,
    emailFromName: (values[BRAND_KEYS.emailFromName] as string) || DEFAULTS.emailFromName,
    logoUrl: await safePresign(logoKey),
    logoDarkUrl: await safePresign(logoDarkKey),
    faviconUrl: await safePresign(faviconKey),
  };
}

/**
 * Public read — herkes (login oncesi dahil) brand'i alabilir.
 */
export async function getBrand(_req: Request, res: Response) {
  const data = await buildBrand();
  res.json({ success: true, data });
}

/**
 * ADMIN: brand text/color alanlarini guncelle.
 */
export async function updateBrand(req: Request, res: Response) {
  const body = req.body as Partial<{
    companyName: string;
    tagline: string;
    primaryColor: string;
    emailFromName: string;
  }>;

  const userId = req.user!.userId;
  const updates: Array<{ key: string; value: string | null }> = [];

  if (body.companyName !== undefined) {
    updates.push({ key: BRAND_KEYS.companyName, value: body.companyName.trim() || null });
  }
  if (body.tagline !== undefined) {
    updates.push({ key: BRAND_KEYS.tagline, value: body.tagline.trim() || null });
  }
  if (body.primaryColor !== undefined) {
    const color = body.primaryColor.trim();
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new AppError('primaryColor #RRGGBB formatinda olmali', 400);
    }
    updates.push({ key: BRAND_KEYS.primaryColor, value: color || null });
  }
  if (body.emailFromName !== undefined) {
    updates.push({ key: BRAND_KEYS.emailFromName, value: body.emailFromName.trim() || null });
  }

  for (const u of updates) {
    await setSetting(u.key, u.value, userId);
  }

  await createAuditLog({
    userId,
    recordType: 'Brand',
    recordId: 0,
    action: 'UPDATE',
    changes: Object.fromEntries(updates.map((u) => [u.key, { old: '***', new: u.value }])),
  });

  const data = await buildBrand();
  res.json({ success: true, data });
}

/**
 * ADMIN: logo / favicon icin presigned upload URL talep et.
 * type: 'logo' | 'logoDark' | 'favicon'
 * Frontend bu URL'e dogrudan PUT atip dosyayi yuklediginde, ardindan
 * /api/brand/asset/confirm cagirilarak key SystemSetting'e kaydedilir.
 */
export async function requestAssetUpload(req: Request, res: Response) {
  if (!(await isStorageConfigured())) {
    throw new AppError(
      'Object storage yapilandirilmamis. Once Sistem Ayarlari > API Anahtarlari ekraninda S3/R2 bilgilerini girin.',
      503,
    );
  }
  const { type, filename, contentType } = req.body as {
    type: 'logo' | 'logoDark' | 'favicon';
    filename: string;
    contentType: string;
  };
  if (!['logo', 'logoDark', 'favicon'].includes(type)) {
    throw new AppError('Gecersiz type (logo | logoDark | favicon)', 400);
  }
  if (!filename || !contentType) throw new AppError('filename + contentType zorunlu', 400);
  if (!/^image\//.test(contentType)) {
    throw new AppError('Sadece image/* kabul edilir', 400);
  }

  const key = buildKey({ ownerType: 'brand', ownerId: type, originalName: filename });
  const { url, method } = await presignUpload({ key, contentType });
  res.json({ success: true, data: { key, uploadUrl: url, method } });
}

/**
 * ADMIN: yuklenen asset'in key'ini SystemSetting'e kaydet.
 */
export async function confirmAssetUpload(req: Request, res: Response) {
  const { type, key } = req.body as { type: 'logo' | 'logoDark' | 'favicon'; key: string | null };
  const userId = req.user!.userId;

  const settingKey =
    type === 'logo'
      ? BRAND_KEYS.logoKey
      : type === 'logoDark'
        ? BRAND_KEYS.logoDarkKey
        : type === 'favicon'
          ? BRAND_KEYS.faviconKey
          : null;
  if (!settingKey) throw new AppError('Gecersiz type', 400);

  await setSetting(settingKey, key || null, userId);

  await createAuditLog({
    userId,
    recordType: 'Brand',
    recordId: 0,
    action: 'UPDATE',
    changes: { [settingKey]: { old: '***', new: key } },
  });

  const data = await buildBrand();
  res.json({ success: true, data });
}
