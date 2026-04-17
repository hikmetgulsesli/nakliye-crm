import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export async function list(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);

  const where: Record<string, unknown> = { userId };

  if (req.query.isRead !== undefined) {
    where.isRead = req.query.isRead === 'true';
  }
  if (req.query.type) {
    where.type = req.query.type;
  }

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  res.json({
    ...paginatedResponse(data, total, { page, pageSize, skip }),
    unreadCount,
  });
}

export async function markAsRead(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.userId;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new AppError('Bildirim bulunamadı', 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({ success: true, data: updated });
}

export async function markAllAsRead(req: Request, res: Response) {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: 'Tüm bildirimler okundu olarak isaretlendi' });
}
