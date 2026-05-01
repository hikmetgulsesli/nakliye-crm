import { getSetting, getManySettings } from './system-settings.service';

/**
 * Tum feature flag isimleri — merkez tanim.
 * Admin UI'da kategoriler halinde gosterilir.
 * Default aktif olanlar: ilk olduklarinda kullanilir, kullanici override eder.
 */

export const FEATURES = {
  // ========= Temel CRM =========
  customers: { default: true, category: 'core', label: 'Müşteri Yönetimi' },
  quotations: { default: true, category: 'core', label: 'Teklif Yönetimi' },
  activities: { default: true, category: 'core', label: 'Aktivite Kaydı' },

  // ========= Operasyonel =========
  shipments: { default: true, category: 'operational', label: 'Sevkiyat Takibi' },
  documents: { default: true, category: 'operational', label: 'Doküman Yönetimi' },
  exchange_rates: { default: true, category: 'operational', label: 'TCMB Kur Takibi' },
  rates: { default: true, category: 'operational', label: 'Navlun Tarifesi' },

  // ========= AI =========
  ai_email_draft: { default: true, category: 'ai', label: 'AI Teklif E-posta Taslağı' },
  win_probability: { default: true, category: 'ai', label: 'AI Kazanma İhtimali' },
  churn_risk: { default: true, category: 'ai', label: 'AI Müşteri Kaybetme Riski' },
  coaching: { default: true, category: 'ai', label: 'AI Personel Koçluğu' },
  smart_queue: { default: true, category: 'ai', label: 'AI Akıllı Sıralama (Bugün Bunlarla Konuş)' },
  voice_memo: { default: false, category: 'ai', label: 'Ses Notu → Transcript (Whisper)' },
  ai_negotiation_coach: { default: true, category: 'ai', label: 'AI Müzakere Koçu' },
  ai_customer_summary: { default: true, category: 'ai', label: 'AI Müşteri Özeti' },

  // ========= İletişim Kanalları =========
  whatsapp: { default: false, category: 'channels', label: 'WhatsApp Gönderimi' },
  sms: { default: false, category: 'channels', label: 'SMS Gönderimi' },
  email_send: { default: false, category: 'channels', label: 'E-posta Gönderimi' },
  imap_sync: { default: false, category: 'channels', label: 'IMAP 2-Yönlü E-posta' },
  message_templates: { default: true, category: 'channels', label: 'Mesaj Şablonları' },
  click_to_call: { default: true, category: 'channels', label: 'Click-to-Call (tel: link)' },

  // ========= Satış Temsilcisi Verimliliği =========
  daily_plan: { default: true, category: 'rep_productivity', label: 'Bugünün İşleri Paneli' },
  followup_reminders: { default: true, category: 'rep_productivity', label: 'Follow-up Hatırlatmaları' },
  customer_contacts: { default: true, category: 'rep_productivity', label: 'Çoklu Yetkili (Contacts)' },
  birthdays: { default: true, category: 'rep_productivity', label: 'Doğum Günü Hatırlatma' },
  geo_checkin: { default: false, category: 'rep_productivity', label: 'Saha Ziyareti Check-in' },

  // ========= Motivasyon =========
  commission: { default: false, category: 'motivation', label: 'Komisyon Takibi' },
  gamification: { default: false, category: 'motivation', label: 'Rozet & Puan Sistemi' },
  sales_goals: { default: true, category: 'motivation', label: 'Kişisel Hedef Belirleme' },

  // ========= UX =========
  command_palette: { default: true, category: 'ux', label: 'Global Arama (⌘K)' },
  internal_notes: { default: true, category: 'ux', label: 'İç Notlar + @mention' },
  customer_timeline: { default: true, category: 'ux', label: 'Müşteri Zaman Çizelgesi' },
  saved_views: { default: true, category: 'ux', label: 'Kaydedilen Görünümler' },
  bulk_actions: { default: true, category: 'ux', label: 'Toplu İşlemler' },
  pwa: { default: true, category: 'ux', label: 'PWA (Mobil Uygulama)' },

  // ========= Genişleme =========
  customer_portal: { default: false, category: 'growth', label: 'Müşteri Portalı (Public)' },
  lead_forms: { default: false, category: 'growth', label: 'Lead Capture Form' },
  realtime_notifications: { default: true, category: 'growth', label: 'Canlı Bildirim (Socket.IO)' },
} as const;

export type FeatureKey = keyof typeof FEATURES;

export type FeatureCategory =
  | 'core'
  | 'operational'
  | 'ai'
  | 'channels'
  | 'rep_productivity'
  | 'motivation'
  | 'ux'
  | 'growth';

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  core: 'Temel CRM',
  operational: 'Operasyonel',
  ai: 'AI Özellikleri',
  channels: 'İletişim Kanalları',
  rep_productivity: 'Satış Temsilcisi Verimliliği',
  motivation: 'Motivasyon & Performans',
  ux: 'Kullanıcı Deneyimi',
  growth: 'Genişleme',
};

function settingKey(feature: FeatureKey): string {
  return `features.${feature}`;
}

/**
 * Bir feature'in aktif olup olmadigini ogren. Cache uzun surmesin diye
 * getSetting 60s in-memory cache kullaniyor.
 */
export async function isFeatureEnabled(feature: FeatureKey): Promise<boolean> {
  const value = await getSetting<boolean>(settingKey(feature));
  if (value === null || value === undefined) {
    return FEATURES[feature].default;
  }
  return value === true;
}

/**
 * Tum feature flag'lerin mevcut durumunu tek seferde getir.
 */
export async function getAllFeatures(): Promise<Record<FeatureKey, boolean>> {
  const keys = Object.keys(FEATURES) as FeatureKey[];
  const settings = await getManySettings(keys.map(settingKey));
  const result = {} as Record<FeatureKey, boolean>;
  for (const k of keys) {
    const v = settings[settingKey(k)];
    result[k] = v === null || v === undefined ? FEATURES[k].default : v === true;
  }
  return result;
}

/**
 * Express middleware: feature kapaliysa 403.
 */
import type { Request, Response, NextFunction } from 'express';

export function requireFeature(feature: FeatureKey) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const enabled = await isFeatureEnabled(feature);
    if (!enabled) {
      return res.status(403).json({
        success: false,
        message: `Bu özellik kapalı: ${FEATURES[feature].label}`,
        feature,
      });
    }
    next();
  };
}
