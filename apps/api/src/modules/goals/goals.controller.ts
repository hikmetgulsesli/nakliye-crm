import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

export async function list(req: Request, res: Response) {
  const userId = req.query.userId ? Number(req.query.userId) : req.user!.userId;
  const rows = await prisma.salesGoal.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { periodEnd: 'desc' },
  });
  res.json({ success: true, data: rows });
}

export async function create(req: Request, res: Response) {
  const { userId, metric, target, periodStart, periodEnd, notes } = req.body as {
    userId?: number | null;
    metric: string;
    target: number;
    periodStart: string;
    periodEnd: string;
    notes?: string;
  };
  if (!metric || !target || !periodStart || !periodEnd)
    throw new AppError('metric, target, periodStart, periodEnd gerekli', 400);

  // Sadece admin baskasi icin hedef koyabilir
  const effectiveUserId =
    req.user!.role === 'ADMIN' ? (userId === undefined ? req.user!.userId : userId) : req.user!.userId;

  const goal = await prisma.salesGoal.create({
    data: {
      userId: effectiveUserId,
      metric,
      target,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      notes,
      createdById: req.user!.userId,
    },
  });
  res.status(201).json({ success: true, data: goal });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const goal = await prisma.salesGoal.findUnique({ where: { id } });
  if (!goal) throw new AppError('Hedef bulunamadı', 404);
  if (req.user!.role !== 'ADMIN' && goal.userId !== req.user!.userId)
    throw new AppError('Yetkiniz yok', 403);
  await prisma.salesGoal.delete({ where: { id } });
  res.json({ success: true });
}

/**
 * Kendi acik hedefleri + ilerleme yuzdesi.
 */
export async function myProgress(req: Request, res: Response) {
  const userId = req.user!.userId;
  const now = new Date();
  const goals = await prisma.salesGoal.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
      periodEnd: { gte: now },
    },
  });

  const results = await Promise.all(
    goals.map(async (g) => {
      let current = 0;
      const where = {
        ...(g.userId ? { assignedUserId: g.userId } : {}),
        isDeleted: false,
        createdAt: { gte: g.periodStart, lte: g.periodEnd },
      } as Record<string, unknown>;

      switch (g.metric) {
        case 'quote_count':
          current = await prisma.quotation.count({ where });
          break;
        case 'won_count':
          current = await prisma.quotation.count({
            where: { ...where, status: 'Kazanıldı' },
          });
          break;
        case 'revenue': {
          const agg = await prisma.quotation.aggregate({
            where: { ...where, status: 'Kazanıldı' },
            _sum: { price: true },
          });
          current = Number(agg._sum.price || 0);
          break;
        }
        case 'activity_count':
          current = await prisma.activity.count({
            where: {
              ...(g.userId ? { createdById: g.userId } : {}),
              isDeleted: false,
              activityDate: { gte: g.periodStart, lte: g.periodEnd },
            },
          });
          break;
      }
      const percent = g.target > 0 ? Math.min(100, Math.round((current / g.target) * 100)) : 0;
      return { ...g, current, percent };
    }),
  );
  res.json({ success: true, data: results });
}
