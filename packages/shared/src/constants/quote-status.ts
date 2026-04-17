export const QUOTE_STATUS = {
  PENDING: 'Bekliyor',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
  CANCELLED: 'İptal',
} as const;

export type QuoteStatus = (typeof QUOTE_STATUS)[keyof typeof QUOTE_STATUS];
