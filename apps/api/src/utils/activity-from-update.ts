import { prisma } from '../config/database';

export const SYSTEM_UPDATE_ACTIVITY_TYPE = 'Sistem Güncellemesi';

const CUSTOMER_FIELD_LABELS: Record<string, string> = {
  companyName: 'Firma Adı',
  contactName: 'Yetkili Adı',
  phone: 'Telefon',
  email: 'E-posta',
  address: 'Adres',
  transportModes: 'Taşıma Modları',
  serviceTypes: 'Servis Tipleri',
  incoterms: 'Incoterms',
  direction: 'Yön',
  originCountries: 'Çıkış Ülkeleri',
  destinationCountries: 'Varış Ülkeleri',
  source: 'Müşteri Kaynağı',
  potential: 'Potansiyel',
  status: 'Durum',
  notes: 'Notlar',
  assignedUserId: 'Atanan Temsilci',
};

const QUOTATION_FIELD_LABELS: Record<string, string> = {
  quoteDate: 'Teklif Tarihi',
  validityDate: 'Geçerlilik Tarihi',
  transportMode: 'Taşıma Modu',
  serviceType: 'Servis Tipi',
  originCountry: 'Çıkış Ülkesi',
  pol: 'Yükleme Limanı',
  destinationCountry: 'Varış Ülkesi',
  pod: 'Boşaltma Limanı',
  incoterm: 'Incoterm',
  price: 'Fiyat',
  currency: 'Para Birimi',
  priceNote: 'Fiyat Notu',
  status: 'Durum',
  lossReason: 'Kaybedilme Nedeni',
  assignedUserId: 'Atanan Temsilci',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-';
  if (Array.isArray(v)) return v.length === 0 ? '-' : v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function summarize(
  changes: Record<string, { old: unknown; new: unknown }>,
  labels: Record<string, string>,
): string {
  return Object.entries(changes)
    .map(([key, diff]) => {
      const label = labels[key] ?? key;
      return `${label}: "${formatValue(diff.old)}" → "${formatValue(diff.new)}"`;
    })
    .join('\n');
}

interface LogParams {
  customerId: number;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  byUserId: number;
  byUserName?: string | null;
}

/**
 * Kayıt sahibi olmayan bir kullanıcı müşteri/teklifi güncellediğinde
 * müşterinin aktivite akışına otomatik bir kayıt düşer. Audit log'a ek
 * olarak çalışır; saha kullanıcılarının "kim n'oluyor" sorusuna
 * cevap verir (sahibi izinli olmasa da çalışmaya devam eder).
 */
export async function logCustomerUpdateActivity({
  customerId,
  changes,
  byUserId,
  byUserName,
}: LogParams) {
  if (!changes) return;
  const summary = summarize(changes, CUSTOMER_FIELD_LABELS);
  const note = byUserName
    ? `${byUserName} müşteri kaydını güncelledi:\n${summary}`
    : `Müşteri kaydı güncellendi:\n${summary}`;

  await prisma.activity.create({
    data: {
      customerId,
      activityType: SYSTEM_UPDATE_ACTIVITY_TYPE,
      activityDate: new Date(),
      notes: note,
      createdById: byUserId,
    },
  });
}

interface QuotationLogParams extends LogParams {
  quoteNo: string;
}

export async function logQuotationUpdateActivity({
  customerId,
  changes,
  byUserId,
  byUserName,
  quoteNo,
}: QuotationLogParams) {
  if (!changes) return;
  const summary = summarize(changes, QUOTATION_FIELD_LABELS);
  const note = byUserName
    ? `${byUserName} ${quoteNo} teklifini güncelledi:\n${summary}`
    : `${quoteNo} teklifi güncellendi:\n${summary}`;

  await prisma.activity.create({
    data: {
      customerId,
      activityType: SYSTEM_UPDATE_ACTIVITY_TYPE,
      activityDate: new Date(),
      notes: note,
      createdById: byUserId,
    },
  });
}
