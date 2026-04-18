import { Request, Response } from 'express';
import { prisma } from '../../config/database';

/**
 * Satis temsilcisinin gununu planladigi widget.
 * 4 liste: bugunku follow-up, bugun dolan teklif, uzun bekleyen teklif, 14gun aranmayan.
 */
export async function today(req: Request, res: Response) {
  const userId = req.user!.userId;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [followups, expiringQuotes, pendingQuotes, uncontacted] = await Promise.all([
    // Bugun planlanmis aktiviteler (next_action_date)
    prisma.activity.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
        nextActionDate: { gte: today, lt: tomorrow },
      },
      include: { customer: { select: { id: true, companyName: true, phone: true } } },
      orderBy: { nextActionDate: 'asc' },
      take: 20,
    }),
    // Geçerlilik bugün dolan teklifler (kendi + PRD: herkes)
    prisma.quotation.findMany({
      where: {
        isDeleted: false,
        status: 'Bekliyor',
        validityDate: { gte: today, lt: tomorrow },
      },
      include: {
        customer: { select: { id: true, companyName: true, phone: true } },
      },
      orderBy: { validityDate: 'asc' },
      take: 10,
    }),
    // 7+ gun yanıt bekleyen (kendi)
    prisma.quotation.findMany({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        status: 'Bekliyor',
        createdAt: { lt: sevenDaysAgo },
      },
      include: { customer: { select: { id: true, companyName: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    }),
    // 14 gun aranmayan (kendi atandigi)
    prisma.customer.findMany({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        status: 'Aktif',
        OR: [{ lastContactDate: { lt: fourteenDaysAgo } }, { lastContactDate: null }],
      },
      select: {
        id: true,
        companyName: true,
        phone: true,
        lastContactDate: true,
        potential: true,
      },
      take: 15,
      orderBy: { lastContactDate: 'asc' },
    }),
  ]);

  res.json({
    success: true,
    data: {
      date: today.toISOString().split('T')[0],
      followups,
      expiringQuotes,
      pendingQuotes,
      uncontacted,
      counts: {
        followups: followups.length,
        expiringQuotes: expiringQuotes.length,
        pendingQuotes: pendingQuotes.length,
        uncontacted: uncontacted.length,
        total: followups.length + expiringQuotes.length + pendingQuotes.length + uncontacted.length,
      },
    },
  });
}
