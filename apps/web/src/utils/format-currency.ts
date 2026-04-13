/**
 * Format a number as currency.
 * Defaults to Turkish Lira (TRY) with tr-TR locale.
 */
export function formatCurrency(
  amount: number | null | undefined,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  if (amount == null) return '-';

  const {
    currency = 'TRY',
    locale = 'tr-TR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options ?? {};

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
