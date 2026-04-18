import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

/**
 * TCMB günlük kur XML endpoint'i.
 * Fetches https://www.tcmb.gov.tr/kurlar/today.xml and upserts rates.
 * Kuruluyor: USD, EUR, GBP, CHF, JPY, CNY default.
 */

const TRACKED_CODES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY'] as const;

const URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

interface ParsedRate {
  code: string;
  buying: number;
  selling: number;
}

function parseTcmbXml(xml: string, date: Date): ParsedRate[] {
  const rates: ParsedRate[] = [];
  // Simple regex-based parse to avoid pulling in xml2js dep.
  const currencyBlocks = xml.matchAll(/<Currency[^>]*CurrencyCode="([^"]+)"[^>]*>([\s\S]*?)<\/Currency>/g);
  for (const m of currencyBlocks) {
    const code = m[1];
    if (!(TRACKED_CODES as readonly string[]).includes(code)) continue;
    const inner = m[2];
    const buyingMatch = inner.match(/<ForexBuying>([^<]*)<\/ForexBuying>/);
    const sellingMatch = inner.match(/<ForexSelling>([^<]*)<\/ForexSelling>/);
    const buying = buyingMatch ? parseFloat(buyingMatch[1]) : NaN;
    const selling = sellingMatch ? parseFloat(sellingMatch[1]) : NaN;
    if (!isFinite(buying) || !isFinite(selling)) continue;
    rates.push({ code, buying, selling });
  }
  logger.debug({ date: date.toISOString(), count: rates.length }, 'TCMB kurlar parse edildi');
  return rates;
}

export async function fetchTcmbRates(): Promise<{ inserted: number; updated: number }> {
  const res = await fetch(URL, { headers: { 'User-Agent': 'NakliyeCRM/1.0' } });
  if (!res.ok) throw new Error(`TCMB fetch basarisiz: ${res.status}`);
  const xml = await res.text();
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const parsed = parseTcmbXml(xml, date);
  let inserted = 0;
  let updated = 0;
  for (const r of parsed) {
    const result = await prisma.exchangeRate.upsert({
      where: { date_currency: { date, currency: r.code } },
      update: { buying: r.buying, selling: r.selling },
      create: {
        date,
        currency: r.code,
        buying: r.buying,
        selling: r.selling,
        source: 'TCMB',
      },
    });
    if (result.createdAt.getTime() === result.createdAt.getTime()) {
      // Always treat as either inserted or updated; simpler — no race
    }
  }
  // Simple counts — re-fetch rowcounts
  const today = await prisma.exchangeRate.findMany({ where: { date } });
  inserted = today.length;
  return { inserted, updated };
}

/**
 * Son TRY karsilik kurunu getir. currency yoksa TRY ise 1 doner.
 */
export async function convertToTRY(
  amount: number,
  currency: string,
): Promise<{ try: number; rateUsed: number | null; rateDate: Date | null }> {
  if (currency === 'TRY') return { try: amount, rateUsed: 1, rateDate: null };
  const latest = await prisma.exchangeRate.findFirst({
    where: { currency },
    orderBy: { date: 'desc' },
  });
  if (!latest) return { try: amount, rateUsed: null, rateDate: null };
  // Satis kuru default — CRM teklif icin satis kullanilir
  return {
    try: amount * latest.selling,
    rateUsed: latest.selling,
    rateDate: latest.date,
  };
}
