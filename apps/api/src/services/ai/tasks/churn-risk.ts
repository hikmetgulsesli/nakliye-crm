import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';

/**
 * Musteri kaybetme riski skor (0-100).
 * Signals:
 * - Son gorusmeden bu yana gecen gun (>60 critical)
 * - Son 180 gunde kaybedilen teklif orani
 * - Son teklif tarihinden bu yana gecen gun
 * - Yüksek/Orta potansiyel + aktivite yok = yuksek risk
 */

export interface ChurnSignal {
  name: string;
  impact: number;
  detail: string;
}

export interface ChurnResult {
  customerId: number;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  signals: ChurnSignal[];
}

const NOW = () => new Date();

export async function computeChurnRisk(customerId: number): Promise<ChurnResult> {
  const c = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      lastContactDate: true,
      lastQuoteDate: true,
      potential: true,
      status: true,
    },
  });
  if (!c) throw new Error('Müşteri bulunamadı');

  const now = NOW();
  const signals: ChurnSignal[] = [];
  let score = 0;

  // 1) Son görüşmeden beri gün
  if (c.lastContactDate) {
    const days = Math.floor(
      (now.getTime() - new Date(c.lastContactDate).getTime()) / 86400000,
    );
    if (days > 90) {
      score += 40;
      signals.push({ name: 'Son Görüşme', impact: 40, detail: `${days} gün (çok uzun)` });
    } else if (days > 60) {
      score += 25;
      signals.push({ name: 'Son Görüşme', impact: 25, detail: `${days} gün` });
    } else if (days > 30) {
      score += 10;
      signals.push({ name: 'Son Görüşme', impact: 10, detail: `${days} gün` });
    }
  } else {
    score += 20;
    signals.push({ name: 'Son Görüşme', impact: 20, detail: 'Hiç kayıt yok' });
  }

  // 2) Son 180 gün teklif performansı
  const sinceSixMonths = new Date(now);
  sinceSixMonths.setDate(sinceSixMonths.getDate() - 180);
  const recentQuotes = await prisma.quotation.groupBy({
    by: ['status'],
    where: {
      customerId,
      isDeleted: false,
      createdAt: { gte: sinceSixMonths },
    },
    _count: { _all: true },
  });
  const total = recentQuotes.reduce((s, r) => s + r._count._all, 0);
  const lost = recentQuotes.find((r) => r.status === 'Kaybedildi')?._count._all ?? 0;
  if (total >= 3) {
    const lossRate = lost / total;
    if (lossRate >= 0.75) {
      score += 25;
      signals.push({
        name: 'Kaybetme Oranı',
        impact: 25,
        detail: `%${Math.round(lossRate * 100)} (${lost}/${total} son 180 gün)`,
      });
    } else if (lossRate >= 0.5) {
      score += 15;
      signals.push({
        name: 'Kaybetme Oranı',
        impact: 15,
        detail: `%${Math.round(lossRate * 100)}`,
      });
    }
  }

  // 3) Son teklif tarihinden beri
  if (c.lastQuoteDate) {
    const days = Math.floor(
      (now.getTime() - new Date(c.lastQuoteDate).getTime()) / 86400000,
    );
    if (days > 120) {
      score += 20;
      signals.push({
        name: 'Son Teklif',
        impact: 20,
        detail: `${days} gün önce (fiyat istemedi)`,
      });
    } else if (days > 60) {
      score += 10;
      signals.push({ name: 'Son Teklif', impact: 10, detail: `${days} gün` });
    }
  }

  // 4) Potansiyel yuksek ama durum pasif/sogukluyorsa
  if (c.potential && (c.potential.includes('üks') || c.potential.includes('uks'))) {
    const days30 = c.lastContactDate
      ? Math.floor((now.getTime() - new Date(c.lastContactDate).getTime()) / 86400000)
      : 999;
    if (days30 > 30) {
      score += 15;
      signals.push({
        name: 'Yüksek Potansiyel + Sessizlik',
        impact: 15,
        detail: 'Değerli müşteri ilgisi kesildi',
      });
    }
  }

  // 5) Status "Soğuk" ise
  if (c.status?.toLowerCase().includes('sog') || c.status?.toLowerCase().includes('soğ')) {
    score += 10;
    signals.push({ name: 'Müşteri Durumu', impact: 10, detail: 'Soğuk' });
  }

  score = Math.max(0, Math.min(100, score));
  const level: ChurnResult['level'] =
    score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  return { customerId, score, level, signals };
}

/**
 * Tum aktif musterileri gez, churn risk hesapla, ChurnRisk tablosuna upsert.
 * Nightly cron ile calistirilir.
 */
export async function runChurnRiskBatch(): Promise<{ processed: number; elevated: number }> {
  const customers = await prisma.customer.findMany({
    where: { isDeleted: false },
    select: { id: true },
  });

  let elevated = 0;
  for (const c of customers) {
    try {
      const result = await computeChurnRisk(c.id);
      await prisma.churnRisk.upsert({
        where: { customerId: c.id },
        update: {
          score: result.score,
          level: result.level,
          signals: result.signals as unknown as object,
          computedAt: new Date(),
        },
        create: {
          customerId: c.id,
          score: result.score,
          level: result.level,
          signals: result.signals as unknown as object,
        },
      });
      if (result.level === 'high' || result.level === 'critical') elevated++;
    } catch (err) {
      logger.warn({ customerId: c.id, err: (err as Error).message }, 'Churn hesap hatasi');
    }
  }
  logger.info({ processed: customers.length, elevated }, 'Churn risk batch tamamlandi');
  return { processed: customers.length, elevated };
}
