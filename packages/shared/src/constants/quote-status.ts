export const QUOTE_STATUS = {
  PENDING: 'Bekliyor',
  WON: 'Kazanildi',
  LOST: 'Kaybedildi',
  CANCELLED: 'Iptal',
} as const;

export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];
