import { prisma } from '../../../config/database';
import { aiChat } from '../index';
import type { AIMessage } from '@nakliye-crm/shared';

export interface CoachingInsight {
  title: string;
  detail: string;
  priority: 'low' | 'medium' | 'high';
}

export interface CoachingResult {
  userId: number;
  userName: string;
  stats: {
    totalQuotes: number;
    wonQuotes: number;
    lostQuotes: number;
    winRate: number;
    avgTimeToClose: number | null;
    totalActivities: number;
    lossReasonBreakdown: Record<string, number>;
  };
  insights: CoachingInsight[];
}

export async function generateCoachingInsights(userId: number): Promise<CoachingResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true },
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  // Son 90 gün istatistik
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const quotes = await prisma.quotation.findMany({
    where: {
      assignedUserId: userId,
      isDeleted: false,
      createdAt: { gte: since },
    },
    select: {
      status: true,
      lossReason: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalQuotes = quotes.length;
  const wonQuotes = quotes.filter((q) => q.status === 'Kazanıldı').length;
  const lostQuotes = quotes.filter((q) => q.status === 'Kaybedildi').length;
  const closed = wonQuotes + lostQuotes;
  const winRate = closed > 0 ? (wonQuotes / closed) * 100 : 0;

  // Loss reason breakdown
  const lossReasonBreakdown: Record<string, number> = {};
  for (const q of quotes.filter((q) => q.status === 'Kaybedildi')) {
    const reason = q.lossReason || 'Belirtilmemiş';
    lossReasonBreakdown[reason] = (lossReasonBreakdown[reason] ?? 0) + 1;
  }

  // Avg time to close (gun)
  const closedQuotes = quotes.filter((q) => q.status === 'Kazanıldı' || q.status === 'Kaybedildi');
  const avgTimeToClose =
    closedQuotes.length > 0
      ? closedQuotes.reduce((sum, q) => {
          const days =
            (new Date(q.updatedAt).getTime() - new Date(q.createdAt).getTime()) / 86400000;
          return sum + days;
        }, 0) / closedQuotes.length
      : null;

  const totalActivities = await prisma.activity.count({
    where: {
      createdById: userId,
      isDeleted: false,
      activityDate: { gte: since },
    },
  });

  // AI ile 3-5 somut oneri uret
  const systemPrompt = `Sen uluslararası nakliye satış takımının bir koçusun.
Temsilci performans verilerini inceleyip 3-5 somut, uygulanabilir ÖNERİ üretiyorsun.

Kurallar:
- Her öneri: başlık (kısa) + detay (1-2 cümle) + öncelik (low/medium/high)
- Türkçe yaz
- Tespit edilen zayıflığa yönelik somut aksiyon öner
- Pozitif tonda, motivasyon edici
- Çıktın SADECE geçerli bir JSON olmalı, başka açıklama ekleme
- JSON şeması:
  { "insights": [ { "title": string, "detail": string, "priority": "low"|"medium"|"high" }, ... ] }`;

  const userPrompt = `Temsilci: ${user.fullName}
Dönem: Son 90 gün

İstatistikler:
- Toplam teklif: ${totalQuotes}
- Kazanılan: ${wonQuotes}
- Kaybedilen: ${lostQuotes}
- Kazanma oranı: %${Math.round(winRate)}
- Ortalama kapanma süresi: ${avgTimeToClose ? Math.round(avgTimeToClose) + ' gün' : 'yetersiz veri'}
- Toplam aktivite: ${totalActivities}
- Kaybetme nedenleri: ${JSON.stringify(lossReasonBreakdown)}

3-5 koçluk önerisi üret.`;

  let insights: CoachingInsight[] = [];

  try {
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    const result = await aiChat(messages, {
      task: 'coaching',
      userId,
      temperature: 0.6,
      maxTokens: 1200,
      responseJson: true,
    });
    // Try to parse JSON
    const cleaned = result.text.replace(/^```json\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.insights)) {
      insights = parsed.insights
        .filter(
          (i: unknown): i is CoachingInsight =>
            typeof i === 'object' &&
            i !== null &&
            'title' in i &&
            'detail' in i &&
            'priority' in i,
        )
        .slice(0, 5);
    }
  } catch {
    // AI hatası → heuristic fallback
    insights = heuristicInsights(winRate, avgTimeToClose, totalQuotes, lossReasonBreakdown, totalActivities);
  }

  if (insights.length === 0) {
    insights = heuristicInsights(winRate, avgTimeToClose, totalQuotes, lossReasonBreakdown, totalActivities);
  }

  return {
    userId: user.id,
    userName: user.fullName,
    stats: {
      totalQuotes,
      wonQuotes,
      lostQuotes,
      winRate: Math.round(winRate),
      avgTimeToClose: avgTimeToClose ? Math.round(avgTimeToClose) : null,
      totalActivities,
      lossReasonBreakdown,
    },
    insights,
  };
}

function heuristicInsights(
  winRate: number,
  avgClose: number | null,
  totalQuotes: number,
  lossReasons: Record<string, number>,
  activities: number,
): CoachingInsight[] {
  const out: CoachingInsight[] = [];
  if (winRate < 30 && totalQuotes >= 5) {
    out.push({
      title: 'Kazanma oranını artırma',
      detail: `Kazanma oranı %${Math.round(winRate)}. Müşteri segmentasyonu ve teklif öncesi ihtiyaç analizine odaklanın.`,
      priority: 'high',
    });
  }
  const topReason = Object.entries(lossReasons).sort((a, b) => b[1] - a[1])[0];
  if (topReason && topReason[1] >= 2) {
    out.push({
      title: `Öne çıkan kaybetme nedeni: ${topReason[0]}`,
      detail: `Son 90 günde ${topReason[1]} teklif "${topReason[0]}" nedeniyle kaybedildi. Fiyat politikası veya sunum stratejisini gözden geçirin.`,
      priority: 'high',
    });
  }
  if (avgClose && avgClose > 21) {
    out.push({
      title: 'Kapanma süresini kısaltma',
      detail: `Ortalama ${Math.round(avgClose)} günde kapanıyor. Takip sıklığını artırın (3-7 gün).`,
      priority: 'medium',
    });
  }
  if (activities < totalQuotes) {
    out.push({
      title: 'Aktivite kaydı düşük',
      detail: 'Teklif sayısına göre aktivite kaydı az. CRM\'de her temasınızı kayıt altına alın.',
      priority: 'medium',
    });
  }
  if (winRate >= 50) {
    out.push({
      title: 'Güçlü performansı sürdürün',
      detail: `%${Math.round(winRate)} kazanma oranı çok iyi. Başarılı yaklaşımınızı ekip ile paylaşın.`,
      priority: 'low',
    });
  }
  return out;
}
