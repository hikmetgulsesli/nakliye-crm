/**
 * Rapor sayfalarinda kullanilan ortak format fonksiyonlari.
 */

export function formatNumber(n: number): string {
  return n.toLocaleString('tr-TR');
}

export function formatCurrency(value: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${formatNumber(Math.round(value))} ${currency}`;
  }
}

export function formatPercent(n: number): string {
  return `%${Math.round(n)}`;
}

const TR_MONTHS = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

/** "2026-05" -> "May 2026" */
export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${TR_MONTHS[idx]} ${y}`;
}

/** "2026-05" -> "May" (kisa, ayni yil icindeyse trend ekseni icin) */
export function formatMonthShort(ym: string): string {
  const [, m] = ym.split('-');
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return TR_MONTHS[idx];
}

export function formatRelative(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} saat önce`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Dün';
  if (diffD < 30) return `${diffD} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMultiCurrency(map: Record<string, number>): string {
  const entries = Object.entries(map).filter(([, v]) => v > 0);
  if (entries.length === 0) return '-';
  return entries.map(([cur, val]) => formatCurrency(val, cur)).join(' · ');
}
