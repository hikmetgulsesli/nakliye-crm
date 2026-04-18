import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

/**
 * Rozet kural tipleri:
 *  - win-count: kazanılan teklif sayısı >= threshold
 *  - quote-count: verilen teklif >= threshold
 *  - activity-count: aktivite >= threshold
 *  - win-rate: son 90g kazanma oranı >= threshold (0-1)
 *  - streak-days: ardisik aktif gun sayisi >= threshold
 */

interface Criteria {
  type: 'win-count' | 'quote-count' | 'activity-count' | 'win-rate' | 'streak-days';
  threshold: number;
  periodDays?: number; // null = all-time
}

async function evaluateUser(userId: number, criteria: Criteria): Promise<boolean> {
  const since = criteria.periodDays
    ? new Date(Date.now() - criteria.periodDays * 86400000)
    : undefined;

  switch (criteria.type) {
    case 'win-count': {
      const count = await prisma.quotation.count({
        where: {
          assignedUserId: userId,
          status: 'Kazanıldı',
          isDeleted: false,
          ...(since && { updatedAt: { gte: since } }),
        },
      });
      return count >= criteria.threshold;
    }
    case 'quote-count': {
      const count = await prisma.quotation.count({
        where: {
          assignedUserId: userId,
          isDeleted: false,
          ...(since && { createdAt: { gte: since } }),
        },
      });
      return count >= criteria.threshold;
    }
    case 'activity-count': {
      const count = await prisma.activity.count({
        where: {
          createdById: userId,
          isDeleted: false,
          ...(since && { activityDate: { gte: since } }),
        },
      });
      return count >= criteria.threshold;
    }
    case 'win-rate': {
      const periodStart = since ?? new Date(Date.now() - 90 * 86400000);
      const all = await prisma.quotation.groupBy({
        by: ['status'],
        where: { assignedUserId: userId, isDeleted: false, updatedAt: { gte: periodStart } },
        _count: { _all: true },
      });
      const total = all.reduce((s, r) => s + r._count._all, 0);
      const won = all.find((r) => r.status === 'Kazanıldı')?._count._all ?? 0;
      const rate = total > 0 ? won / total : 0;
      return rate >= criteria.threshold;
    }
    default:
      return false;
  }
}

/**
 * Tum aktif rozetleri tum aktif kullanicilar icin degerlendir. Idempotent —
 * zaten alinmis rozet tekrar verilmez.
 */
export async function evaluateAllBadges(): Promise<{ awarded: number }> {
  const [badges, users] = await Promise.all([
    prisma.badge.findMany({ where: { isActive: true } }),
    prisma.user.findMany({ where: { isActive: true, role: 'USER' }, select: { id: true } }),
  ]);

  let awarded = 0;
  for (const user of users) {
    for (const badge of badges) {
      try {
        const crit = badge.criteria as unknown as Criteria;
        const hasBadge = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
        });
        if (hasBadge) continue;
        const pass = await evaluateUser(user.id, crit);
        if (pass) {
          await prisma.userBadge.create({
            data: { userId: user.id, badgeId: badge.id },
          });
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'success',
              title: '🏆 Yeni Rozet Kazandınız',
              message: `${badge.name}: ${badge.description || ''}`,
            },
          });
          awarded++;
        }
      } catch (err) {
        logger.warn(
          { err: (err as Error).message, badgeId: badge.id, userId: user.id },
          'Rozet değerlendirme hatası',
        );
      }
    }
  }
  return { awarded };
}
