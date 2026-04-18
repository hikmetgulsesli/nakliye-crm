import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { evaluateAllBadges } from '../../services/gamification/badge-engine';

// ========== Badges CRUD ==========

export async function listBadges(_req: Request, res: Response) {
  const badges = await prisma.badge.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { awards: true } } },
  });
  res.json({ success: true, data: badges });
}

export async function createBadge(req: Request, res: Response) {
  const { code, name, description, icon, criteria } = req.body as {
    code: string;
    name: string;
    description?: string;
    icon?: string;
    criteria: Record<string, unknown>;
  };
  if (!code || !name || !criteria) throw new AppError('code + name + criteria gerekli', 400);
  const badge = await prisma.badge.create({
    data: { code, name, description, icon, criteria: criteria as object },
  });
  res.status(201).json({ success: true, data: badge });
}

export async function updateBadge(req: Request, res: Response) {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of ['name', 'description', 'icon', 'criteria', 'isActive']) {
    if (k in b) data[k] = b[k];
  }
  const badge = await prisma.badge.update({ where: { id }, data });
  res.json({ success: true, data: badge });
}

export async function removeBadge(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.badge.delete({ where: { id } });
  res.json({ success: true });
}

export async function evaluateNow(_req: Request, res: Response) {
  const result = await evaluateAllBadges();
  res.json({ success: true, data: result });
}

// ========== User profile ==========

export async function myBadges(req: Request, res: Response) {
  const userId = req.user!.userId;
  const awards = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: 'desc' },
  });
  res.json({ success: true, data: awards });
}

// ========== Leaderboard ==========

export async function leaderboard(req: Request, res: Response) {
  const periodDays = Math.min(365, Number(req.query.days ?? 30));
  const since = new Date(Date.now() - periodDays * 86400000);

  const users = await prisma.user.findMany({
    where: { isActive: true, role: 'USER' },
    select: { id: true, fullName: true, avatarUrl: true },
  });

  const results = await Promise.all(
    users.map(async (u) => {
      const [won, total, activities, badges] = await Promise.all([
        prisma.quotation.count({
          where: {
            assignedUserId: u.id,
            status: 'Kazanıldı',
            isDeleted: false,
            updatedAt: { gte: since },
          },
        }),
        prisma.quotation.count({
          where: {
            assignedUserId: u.id,
            isDeleted: false,
            createdAt: { gte: since },
          },
        }),
        prisma.activity.count({
          where: { createdById: u.id, isDeleted: false, activityDate: { gte: since } },
        }),
        prisma.userBadge.count({ where: { userId: u.id } }),
      ]);
      const winRate = total > 0 ? won / total : 0;
      // Basit puan: kazanilan*10 + aktivite*1 + rozet*5
      const points = won * 10 + activities + badges * 5;
      return { ...u, won, total, winRate, activities, badges, points };
    }),
  );

  results.sort((a, b) => b.points - a.points);
  res.json({ success: true, data: results });
}
