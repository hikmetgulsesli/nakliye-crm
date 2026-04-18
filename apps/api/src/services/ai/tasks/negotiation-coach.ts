import { prisma } from '../../../config/database';
import { aiChat } from '../index';
import type { AIMessage } from '@nakliye-crm/shared';

export interface NegotiationAdvice {
  context: {
    lostQuote: {
      quoteNo: string;
      price: number;
      currency: string;
      lossReason: string | null;
      customer: string;
    };
    similarWins: Array<{
      quoteNo: string;
      price: number;
      currency: string;
      customer: string;
    }>;
  };
  advice: string;
}

/**
 * Kaybedilen bir teklif icin AI oneri — benzer kosullarda kazanilan
 * tekliflerden ogrenip strateji onerisi uretir.
 */
export async function getNegotiationAdvice(
  lostQuoteId: number,
  userId: number,
): Promise<NegotiationAdvice> {
  const lost = await prisma.quotation.findUnique({
    where: { id: lostQuoteId },
    include: { customer: { select: { companyName: true } } },
  });
  if (!lost) throw new Error('Teklif bulunamadı');
  if (lost.status !== 'Kaybedildi') {
    throw new Error('Bu teklif kaybedilmemiş, koçluk uygun değil');
  }

  // Benzer kazanılan teklifler (aynı rota, mode)
  const similar = await prisma.quotation.findMany({
    where: {
      status: 'Kazanıldı',
      isDeleted: false,
      transportMode: lost.transportMode,
      OR: [
        { originCountry: lost.originCountry, destinationCountry: lost.destinationCountry },
        { serviceType: lost.serviceType },
      ],
      id: { not: lost.id },
    },
    include: { customer: { select: { companyName: true } } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
  });

  const context = {
    lostQuote: {
      quoteNo: lost.quoteNo,
      price: Number(lost.price || 0),
      currency: lost.currency || '',
      lossReason: lost.lossReason,
      customer: lost.customer.companyName,
    },
    similarWins: similar.map((s) => ({
      quoteNo: s.quoteNo,
      price: Number(s.price || 0),
      currency: s.currency || '',
      customer: s.customer.companyName,
    })),
  };

  const systemPrompt = `Sen deneyimli bir nakliye satış koçusun. Kaybedilen
bir teklifi ve benzer kazanılan teklifleri inceleyip temsilciye kısa,
uygulanabilir 3-5 maddelik bir öneri yaz.

Kurallar:
- Türkçe, samimi ama profesyonel ton
- Her öneri: kısa başlık + 1-2 cümle açıklama
- Fiyat karşılaştırması, müzakere taktikleri, gelecekte neye dikkat etmeli
- Markdown kullan (bullet + bold)
- Boş iyimserlik değil, somut taktik`;

  const userPrompt = `Kaybedilen teklif:
- ${context.lostQuote.quoteNo} / ${context.lostQuote.customer}
- Fiyat: ${context.lostQuote.price} ${context.lostQuote.currency}
- Kaybetme nedeni: ${context.lostQuote.lossReason || 'belirtilmemiş'}

${
  similar.length > 0
    ? `Benzer kazanılan teklifler:\n${similar
        .map(
          (s) =>
            `- ${s.quoteNo} / ${s.customer.companyName}: ${s.price} ${s.currency || ''}`,
        )
        .join('\n')}`
    : 'Benzer kazanılmış teklif yok — geniş stratejiye odaklan.'
}

Lütfen 3-5 somut öneri ver.`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await aiChat(messages, {
    task: 'coaching',
    userId,
    temperature: 0.6,
    maxTokens: 800,
  });

  return { context, advice: result.text };
}
