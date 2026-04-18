import { prisma } from '../../../config/database';

/**
 * Bugün bunlarla konuş — temsilciye önceliklendirilmiş müşteri listesi.
 * Skoring: potansiyel + son aktivite gap + açık teklif + churn risk.
 */

export interface SmartQueueItem {
  customerId: number;
  companyName: string;
  phone: string;
  priority: number; // 0-100
  reasons: string[];
  lastContactDate: string | null;
  openQuoteCount: number;
}

export async function getSmartQueue(userId: number, limit = 10): Promise<SmartQueueItem[]> {
  const now = new Date();
  const customers = await prisma.customer.findMany({
    where: {
      assignedUserId: userId,
      isDeleted: false,
      status: 'Aktif',
    },
    select: {
      id: true,
      companyName: true,
      phone: true,
      potential: true,
      lastContactDate: true,
      lastQuoteDate: true,
    },
  });

  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);

  const [openQuotes, churnRisks] = await Promise.all([
    prisma.quotation.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        status: 'Bekliyor',
        isDeleted: false,
      },
      _count: { _all: true },
    }),
    prisma.churnRisk.findMany({
      where: { customerId: { in: customerIds } },
    }),
  ]);

  const openMap = new Map(openQuotes.map((r) => [r.customerId, r._count._all]));
  const riskMap = new Map(churnRisks.map((r) => [r.customerId, r]));

  const items: SmartQueueItem[] = customers.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    // Potansiyel
    if (c.potential?.toLowerCase().includes('üks') || c.potential?.toLowerCase().includes('uks')) {
      score += 25;
      reasons.push('Yüksek potansiyel');
    } else if (c.potential?.toLowerCase().includes('orta')) {
      score += 12;
      reasons.push('Orta potansiyel');
    }

    // Açık teklif
    const openCount = openMap.get(c.id) ?? 0;
    if (openCount > 0) {
      score += 15 + Math.min(10, openCount * 3);
      reasons.push(`${openCount} açık teklif`);
    }

    // Son görüşme gap
    if (c.lastContactDate) {
      const days = Math.floor(
        (now.getTime() - new Date(c.lastContactDate).getTime()) / 86400000,
      );
      if (days >= 30) {
        score += 25;
        reasons.push(`${days} gündür aranmadı`);
      } else if (days >= 14) {
        score += 15;
        reasons.push(`${days} gün oldu`);
      } else if (days >= 7) {
        score += 8;
        reasons.push(`${days} gündür görüşülmedi`);
      }
    } else {
      score += 10;
      reasons.push('Henüz görüşme kaydı yok');
    }

    // Churn risk
    const risk = riskMap.get(c.id);
    if (risk) {
      if (risk.level === 'critical') {
        score += 30;
        reasons.push('KRİTİK kayıp riski');
      } else if (risk.level === 'high') {
        score += 20;
        reasons.push('Yüksek kayıp riski');
      }
    }

    return {
      customerId: c.id,
      companyName: c.companyName,
      phone: c.phone,
      priority: Math.min(100, score),
      reasons,
      lastContactDate: c.lastContactDate ? c.lastContactDate.toISOString() : null,
      openQuoteCount: openCount,
    };
  });

  items.sort((a, b) => b.priority - a.priority);
  return items.slice(0, limit);
}
