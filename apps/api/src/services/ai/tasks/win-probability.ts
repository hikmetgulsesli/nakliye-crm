import { prisma } from '../../../config/database';

/**
 * Basit heuristic kazanma ihtimali skoru (0-100).
 * 100+ kapali teklif olunca training modeli degistirilebilir.
 *
 * Signals:
 * - Temsilcinin geçmiş kazanma oranı (ağırlık: 35)
 * - Müşteri potansiyeli (Düşük=0, Orta=10, Yüksek=20)
 * - Revize sayısı (çok revize = zorlu müşteri, her rev -5)
 * - Müşteri kaynağı (Referans=+15, Fuar=+10, Soğuk arama=0)
 * - Son görüşmeden bu yana gün sayısı (<7gün=+10, <14gün=+5, >30gün=-10)
 * - Müşterinin kendi geçmiş kazanma oranı (ağırlık: 20)
 */

export interface WinProbabilityResult {
  quotationId: number;
  probability: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  signals: Array<{ name: string; impact: number; detail: string }>;
}

export async function calculateWinProbability(quotationId: number): Promise<WinProbabilityResult> {
  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: {
        select: {
          potential: true,
          source: true,
          lastContactDate: true,
          status: true,
        },
      },
    },
  });
  if (!q) throw new Error('Teklif bulunamadı');

  const signals: Array<{ name: string; impact: number; detail: string }> = [];
  let score = 50; // baseline

  // 1) Temsilci kazanma oranı
  const repStats = await prisma.quotation.groupBy({
    by: ['status'],
    where: {
      assignedUserId: q.assignedUserId,
      isDeleted: false,
      id: { not: q.id },
    },
    _count: { _all: true },
  });
  const repTotal = repStats.reduce((s, r) => s + r._count._all, 0);
  const repWon = repStats.find((r) => r.status === 'Kazanıldı')?._count._all ?? 0;
  if (repTotal >= 5) {
    const repWinRate = repWon / repTotal;
    const delta = Math.round((repWinRate - 0.5) * 35);
    score += delta;
    signals.push({
      name: 'Temsilci Kazanma Oranı',
      impact: delta,
      detail: `%${Math.round(repWinRate * 100)} (${repWon}/${repTotal} kazanıldı)`,
    });
  }

  // 2) Müşteri potansiyeli
  if (q.customer?.potential) {
    const pot = q.customer.potential.toLowerCase();
    if (pot.includes('yüksek') || pot.includes('yuksek')) {
      score += 20;
      signals.push({ name: 'Müşteri Potansiyeli', impact: 20, detail: 'Yüksek' });
    } else if (pot.includes('orta')) {
      score += 10;
      signals.push({ name: 'Müşteri Potansiyeli', impact: 10, detail: 'Orta' });
    } else if (pot.includes('düşük') || pot.includes('dusuk')) {
      score -= 5;
      signals.push({ name: 'Müşteri Potansiyeli', impact: -5, detail: 'Düşük' });
    }
  }

  // 3) Revize sayısı
  if (q.revisionCount && q.revisionCount > 0) {
    const delta = -Math.min(15, q.revisionCount * 3);
    score += delta;
    signals.push({
      name: 'Revize Sayısı',
      impact: delta,
      detail: `${q.revisionCount} revize (müşteri kararsız)`,
    });
  }

  // 4) Müşteri kaynağı
  if (q.customer?.source) {
    const src = q.customer.source.toLowerCase();
    if (src.includes('referans')) {
      score += 15;
      signals.push({ name: 'Müşteri Kaynağı', impact: 15, detail: 'Referans (güvenilir)' });
    } else if (src.includes('fuar')) {
      score += 10;
      signals.push({ name: 'Müşteri Kaynağı', impact: 10, detail: 'Fuar' });
    } else if (src.includes('soğuk') || src.includes('soguk')) {
      score -= 5;
      signals.push({ name: 'Müşteri Kaynağı', impact: -5, detail: 'Soğuk arama' });
    }
  }

  // 5) Son görüşmeden bu yana
  if (q.customer?.lastContactDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(q.customer.lastContactDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince < 7) {
      score += 10;
      signals.push({ name: 'Son Görüşme', impact: 10, detail: `${daysSince} gün önce (sıcak)` });
    } else if (daysSince < 14) {
      score += 5;
      signals.push({ name: 'Son Görüşme', impact: 5, detail: `${daysSince} gün önce` });
    } else if (daysSince > 30) {
      score -= 10;
      signals.push({ name: 'Son Görüşme', impact: -10, detail: `${daysSince} gün önce (soğudu)` });
    }
  }

  // 6) Müşterinin geçmiş kazanma oranı
  const custStats = await prisma.quotation.groupBy({
    by: ['status'],
    where: { customerId: q.customerId, isDeleted: false, id: { not: q.id } },
    _count: { _all: true },
  });
  const custTotal = custStats.reduce((s, r) => s + r._count._all, 0);
  const custWon = custStats.find((r) => r.status === 'Kazanıldı')?._count._all ?? 0;
  if (custTotal >= 3) {
    const custWinRate = custWon / custTotal;
    const delta = Math.round((custWinRate - 0.5) * 20);
    score += delta;
    signals.push({
      name: 'Müşteri Geçmiş Kazanma',
      impact: delta,
      detail: `%${Math.round(custWinRate * 100)} (${custWon}/${custTotal})`,
    });
  }

  // Clamp + confidence
  score = Math.max(5, Math.min(95, score));
  const confidence: 'low' | 'medium' | 'high' =
    signals.length >= 4 ? 'high' : signals.length >= 2 ? 'medium' : 'low';

  return {
    quotationId: q.id,
    probability: score,
    confidence,
    signals,
  };
}
