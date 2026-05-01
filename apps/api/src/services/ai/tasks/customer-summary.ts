import { prisma } from '../../../config/database';
import { aiChat } from '../index';
import type { AIMessage } from '@nakliye-crm/shared';

export interface CustomerSummary {
  context: {
    customer: {
      name: string;
      contactName: string | null;
      potential: string | null;
      status: string;
      lastContactDate: string | null;
    };
    metrics: {
      totalQuotes: number;
      wonQuotes: number;
      lostQuotes: number;
      pendingQuotes: number;
      wonValue: Record<string, number>;
      activeShipments: number;
      activitiesLast90d: number;
    };
  };
  summary: string;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Müşteri detay sayfasında gösterilen bağlamsal özet. Son 90 gün metrikleri
 * + son aktiviteleri toparlayıp kısa bir Türkçe özet üretir. Görüşme öncesi
 * "ne durumdayız?" sorusunu 3-4 cümleyle cevaplamayı hedefler.
 */
export async function getCustomerSummary(
  customerId: number,
  userId: number,
): Promise<CustomerSummary> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      potential: true,
      status: true,
      lastContactDate: true,
    },
  });
  if (!customer) throw new Error('Müşteri bulunamadı');

  const since = new Date(Date.now() - NINETY_DAYS_MS);

  const [quotes, shipments, activities] = await Promise.all([
    prisma.quotation.findMany({
      where: { customerId, isDeleted: false },
      select: {
        quoteNo: true,
        status: true,
        price: true,
        currency: true,
        quoteDate: true,
        originCountry: true,
        destinationCountry: true,
        transportMode: true,
        lossReason: true,
      },
      orderBy: { quoteDate: 'desc' },
      take: 20,
    }),
    prisma.shipment.findMany({
      where: { customerId, isDeleted: false },
      select: { shipmentNo: true, status: true, transportMode: true, eta: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.activity.findMany({
      where: { customerId, isDeleted: false, activityDate: { gte: since } },
      select: { activityType: true, activityDate: true, notes: true, outcome: true },
      orderBy: { activityDate: 'desc' },
      take: 10,
    }),
  ]);

  const wonQuotes = quotes.filter((q) => q.status === 'Kazanıldı');
  const lostQuotes = quotes.filter((q) => q.status === 'Kaybedildi');
  const pendingQuotes = quotes.filter((q) => q.status === 'Bekliyor');

  const wonValue: Record<string, number> = {};
  for (const q of wonQuotes) {
    const cur = q.currency || 'USD';
    wonValue[cur] = (wonValue[cur] || 0) + Number(q.price || 0);
  }

  const activeShipments = shipments.filter(
    (s) => !['delivered', 'cancelled', 'completed'].includes((s.status || '').toLowerCase()),
  ).length;

  const context: CustomerSummary['context'] = {
    customer: {
      name: customer.companyName,
      contactName: customer.contactName,
      potential: customer.potential,
      status: customer.status,
      lastContactDate: customer.lastContactDate?.toISOString() ?? null,
    },
    metrics: {
      totalQuotes: quotes.length,
      wonQuotes: wonQuotes.length,
      lostQuotes: lostQuotes.length,
      pendingQuotes: pendingQuotes.length,
      wonValue,
      activeShipments,
      activitiesLast90d: activities.length,
    },
  };

  const systemPrompt = `Sen tecrübeli bir nakliye/lojistik CRM asistanısın.
Bir satış temsilcisi müşteriyi aramak/ziyaret etmek üzere — sen kısa bir
hazırlık özeti vereceksin.

Kurallar:
- Türkçe, profesyonel ama samimi ton
- 3-5 cümle, en fazla 6 satır
- Spesifik sayılar kullan (kaç sevkiyat, hangi rota, ne kadar gelir)
- Bir sonraki temas için somut bir öneri/tetik içer
- Markdown bold (**…**) kullan, başlık veya bullet kullanma
- Belirsiz övgülerden kaçın ("harika", "muhteşem" yok)`;

  const lastQuotesLines = quotes
    .slice(0, 8)
    .map(
      (q) =>
        `- ${q.quoteNo} / ${q.status} / ${q.transportMode || '-'} / ${q.originCountry || '-'}→${q.destinationCountry || '-'} / ${q.price ?? '-'} ${q.currency || ''}${q.lossReason ? ` (kayıp nedeni: ${q.lossReason})` : ''}`,
    )
    .join('\n');

  const lastActivitiesLines = activities
    .slice(0, 5)
    .map(
      (a) =>
        `- ${a.activityDate.toISOString().slice(0, 10)} / ${a.activityType} / ${
          a.notes?.slice(0, 80) || '(not yok)'
        }`,
    )
    .join('\n');

  const userPrompt = `Müşteri: **${customer.companyName}**
Yetkili: ${customer.contactName || 'belirtilmemiş'}
Potansiyel: ${customer.potential || '-'}, Durum: ${customer.status}
Son temas: ${customer.lastContactDate?.toISOString().slice(0, 10) || 'kaydedilmemiş'}

Son 90 gün özeti:
- Toplam teklif: ${quotes.length} (kazanılan ${wonQuotes.length}, kaybedilen ${lostQuotes.length}, bekleyen ${pendingQuotes.length})
- Aktif sevkiyat: ${activeShipments}
- Son 90 günde aktivite: ${activities.length}
- Kazanılan değer: ${
    Object.keys(wonValue).length === 0
      ? 'yok'
      : Object.entries(wonValue)
          .map(([c, v]) => `${v.toLocaleString('tr-TR')} ${c}`)
          .join(' · ')
  }

Son teklifler:
${lastQuotesLines || '(yok)'}

Son aktiviteler:
${lastActivitiesLines || '(yok)'}

Bu müşteri için hazırlık özetini yaz.`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await aiChat(messages, {
    task: 'customer-summary',
    userId,
    temperature: 0.5,
    maxTokens: 400,
  });

  return { context, summary: result.text };
}
