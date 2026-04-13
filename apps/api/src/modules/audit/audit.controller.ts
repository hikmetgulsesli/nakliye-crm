import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.userId) where.userId = parseInt(String(req.query.userId), 10);
  if (req.query.recordType) where.recordType = req.query.recordType;
  if (req.query.action) where.action = req.query.action;

  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, pageSize, skip }));
}

export async function getByRecord(req: Request, res: Response) {
  const { type, id } = req.params;
  const recordId = parseInt(id, 10);

  const logs = await prisma.auditLog.findMany({
    where: {
      recordType: type,
      recordId: recordId,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: logs });
}
