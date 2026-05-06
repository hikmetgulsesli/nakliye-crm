import { prisma } from '../config/database';

export const SYSTEM_UPDATE_ACTIVITY_TYPE = 'Sistem Güncellemesi';
export const SYSTEM_EVENT_ACTIVITY_TYPE = 'Sistem Olayı';

/**
 * Iki yardimci yan etki: Activity yazar + musteri lastContactDate guncellenir.
 * Operasyon ile ilgili anlamli olaylar (teklif olustu, sevkiyat olustu, durum
 * degisti) musteri zaman cizelgesine duser ve "X gundur etkilesim yok" filtresi
 * dogru calisir.
 */
async function writeCrmEvent(params: {
  customerId: number;
  byUserId: number;
  note: string;
  activityType?: string;
}) {
  const { customerId, byUserId, note, activityType } = params;
  const now = new Date();
  await prisma.$transaction([
    prisma.activity.create({
      data: {
        customerId,
        activityType: activityType ?? SYSTEM_EVENT_ACTIVITY_TYPE,
        activityDate: now,
        notes: note,
        createdById: byUserId,
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { lastContactDate: now },
    }),
  ]);
}

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

/* ---------- CRM Event helper'lari (Seviye 2: lastContactDate de gunceller) ---------- */

interface QuotationCreatedParams {
  customerId: number;
  quoteNo: string;
  byUserId: number;
  byUserName?: string | null;
}
export async function logQuotationCreatedActivity(p: QuotationCreatedParams) {
  const note = p.byUserName
    ? `${p.byUserName} yeni teklif oluşturdu: ${p.quoteNo}`
    : `Yeni teklif oluşturuldu: ${p.quoteNo}`;
  await writeCrmEvent({
    customerId: p.customerId,
    byUserId: p.byUserId,
    note,
  });
}

interface QuotationStatusChangedParams {
  customerId: number;
  quoteNo: string;
  oldStatus: string;
  newStatus: string;
  byUserId: number;
  byUserName?: string | null;
}
export async function logQuotationStatusChangedActivity(p: QuotationStatusChangedParams) {
  const who = p.byUserName ? `${p.byUserName}` : 'Sistem';
  const note = `${who} ${p.quoteNo} teklifinin durumunu "${p.oldStatus || '-'}" → "${p.newStatus}" olarak güncelledi.`;
  await writeCrmEvent({
    customerId: p.customerId,
    byUserId: p.byUserId,
    note,
  });
}

interface ShipmentCreatedParams {
  customerId: number;
  shipmentNo: string;
  byUserId: number;
  byUserName?: string | null;
  fromQuoteNo?: string | null;
}
export async function logShipmentCreatedActivity(p: ShipmentCreatedParams) {
  const who = p.byUserName ? p.byUserName : 'Sistem';
  const tail = p.fromQuoteNo
    ? ` (${p.fromQuoteNo} teklifinden otomatik)`
    : '';
  const note = `${who} yeni sevkiyat oluşturdu: ${p.shipmentNo}${tail}`;
  await writeCrmEvent({
    customerId: p.customerId,
    byUserId: p.byUserId,
    note,
  });
}

interface ShipmentStatusChangedParams {
  customerId: number;
  shipmentNo: string;
  oldStatus: string;
  newStatus: string;
  byUserId: number;
  byUserName?: string | null;
}
export async function logShipmentStatusChangedActivity(p: ShipmentStatusChangedParams) {
  const who = p.byUserName ? p.byUserName : 'Sistem';
  const note = `${who} ${p.shipmentNo} sevkiyatının durumunu "${p.oldStatus || '-'}" → "${p.newStatus}" olarak güncelledi.`;
  await writeCrmEvent({
    customerId: p.customerId,
    byUserId: p.byUserId,
    note,
  });
}
