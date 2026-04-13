export const LOOKUP_CATEGORIES = {
  TRANSPORT_MODE: 'transport_mode',
  SERVICE_TYPE: 'service_type',
  INCOTERM: 'incoterm',
  CUSTOMER_SOURCE: 'customer_source',
  CUSTOMER_STATUS: 'customer_status',
  POTENTIAL_LEVEL: 'potential_level',
  QUOTE_STATUS: 'quote_status',
  LOSS_REASON: 'loss_reason',
  CURRENCY: 'currency',
  PORT: 'port',
  COUNTRY: 'country',
  ACTIVITY_TYPE: 'activity_type',
  ACTIVITY_OUTCOME: 'activity_outcome',
} as const;

export type LookupCategory = (typeof LOOKUP_CATEGORIES)[keyof typeof LOOKUP_CATEGORIES];

export const LOOKUP_CATEGORY_LABELS: Record<string, string> = {
  transport_mode: 'Tasima Modu',
  service_type: 'Servis Tipi',
  incoterm: 'Incoterms',
  customer_source: 'Musteri Kaynagi',
  customer_status: 'Musteri Durumu',
  potential_level: 'Potansiyel Seviyesi',
  quote_status: 'Teklif Durumu',
  loss_reason: 'Kaybedilme Nedeni',
  currency: 'Para Birimi',
  port: 'Liman / Nokta',
  country: 'Ulke',
  activity_type: 'Aktivite Tipi',
  activity_outcome: 'Aktivite Sonucu',
};
