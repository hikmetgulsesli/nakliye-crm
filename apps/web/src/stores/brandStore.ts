import { create } from 'zustand';
import api from '@/config/api';

export interface BrandPayload {
  companyName: string;
  tagline: string;
  primaryColor: string;
  emailFromName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
}

interface BrandState {
  brand: BrandPayload;
  loaded: boolean;
  fetch: () => Promise<void>;
  applyTheme: (color?: string) => void;
  applyDocumentTitle: (suffix?: string) => void;
  applyFavicon: (url?: string | null) => void;
  /** Update brand text/color via PATCH/PUT — server returns fresh payload. */
  update: (patch: Partial<Pick<BrandPayload, 'companyName' | 'tagline' | 'primaryColor' | 'emailFromName'>>) => Promise<void>;
  /** After uploading an asset to S3, server records the storage key. */
  confirmAsset: (type: 'logo' | 'logoDark' | 'favicon', key: string | null) => Promise<void>;
  /** Server returns presigned PUT url for direct upload. */
  requestAssetUpload: (
    type: 'logo' | 'logoDark' | 'favicon',
    filename: string,
    contentType: string,
  ) => Promise<{ key: string; uploadUrl: string; method: 'PUT' }>;
}

export const DEFAULT_BRAND: BrandPayload = {
  companyName: 'NakliyeCRM',
  tagline: 'Nakliye Operasyon Yönetimi',
  primaryColor: '#2563eb',
  emailFromName: 'NakliyeCRM',
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
};

/**
 * Reaktif, her zaman safe brand donduren hook. `brand` herhangi bir sebeple
 * undefined olursa DEFAULT_BRAND'a duser — UI hic crash etmesin.
 */
export function useBrand(): BrandPayload {
  return useBrandStore((s) => s.brand) ?? DEFAULT_BRAND;
}

// ----- Color utilities (hex <-> HSL) for hover variant -----
function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darken(hex: string, byL: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex(hsl[0], hsl[1], Math.max(0, hsl[2] - byL));
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${m[1]}${a}`;
}

export const useBrandStore = create<BrandState>()((set, get) => ({
  brand: DEFAULT_BRAND,
  loaded: false,

  applyTheme: (color?: string) => {
    const c = color || get().brand.primaryColor;
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Mevcut --accent token'i Tailwind primary'e bagli; degistirince tum
    // primary-bg / text / border'lar runtime'da swap olur.
    root.style.setProperty('--accent', c);
    root.style.setProperty('--accent-hover', darken(c, 8));
    root.style.setProperty('--accent-soft', withAlpha(c, 0.1));
  },

  applyDocumentTitle: (suffix?: string) => {
    if (typeof document === 'undefined') return;
    const name = get().brand.companyName;
    document.title = suffix ? `${suffix} · ${name}` : name;
  },

  applyFavicon: (url?: string | null) => {
    const target = url ?? get().brand.faviconUrl;
    if (!target || typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = target;
  },

  // NOT: api.ts'teki response interceptor {success, data} zarfini otomatik
  // unwrap ediyor, dolayisiyla axios `response.data` zaten `data.data` icerir.
  // Bu yuzden burada `data` zaten BrandPayload — `data.data` ile erisilmemeli.
  fetch: async () => {
    try {
      const { data: brand } = await api.get<BrandPayload>('/brand');
      if (!brand) {
        set({ loaded: true });
        return;
      }
      set({ brand, loaded: true });
      get().applyTheme(brand.primaryColor);
      get().applyDocumentTitle();
      get().applyFavicon(brand.faviconUrl);
    } catch {
      set({ loaded: true });
    }
  },

  update: async (patch) => {
    const { data: brand } = await api.put<BrandPayload>('/brand', patch);
    if (!brand) throw new Error('Brand güncellendi ama sunucu yanıtı boş');
    set({ brand, loaded: true });
    get().applyTheme(brand.primaryColor);
    get().applyDocumentTitle();
  },

  requestAssetUpload: async (type, filename, contentType) => {
    const { data } = await api.post<{ key: string; uploadUrl: string; method: 'PUT' }>(
      '/brand/asset/upload-url',
      { type, filename, contentType },
    );
    return data;
  },

  confirmAsset: async (type, key) => {
    const { data: brand } = await api.post<BrandPayload>('/brand/asset/confirm', {
      type,
      key,
    });
    if (!brand) return;
    set({ brand, loaded: true });
    if (type === 'favicon') get().applyFavicon(brand.faviconUrl);
  },
}));
