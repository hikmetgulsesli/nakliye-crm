import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { parsePagination, paginatedResponse, parseSort } from '../../utils/pagination';

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.userId) where.userId = parseInt(String(req.query.userId), 10);
  if (req.query.recordType) where.recordType = req.query.recordType;
  if (req.query.recordId) where.recordId = parseInt(String(req.query.recordId), 10);
  if (req.query.action) where.action = req.query.action;

  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  const orderBy = parseSort(req.query as Record<string, unknown>, {
    allowedFields: ['createdAt', 'recordType', 'action'] as const,
    defaultField: 'createdAt',
  });

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      skip,
      take: pageSize,
      orderBy,
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

export async function exportCsv(req: Request, res: Response) {
  const where: Record<string, unknown> = {};

  if (req.query.userId) where.userId = parseInt(String(req.query.userId), 10);
  if (req.query.recordType) where.recordType = req.query.recordType;
  if (req.query.action) where.action = req.query.action;

  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'ID,Kullanıcı,Email,Kayıt Tipi,Kayıt ID,Aksiyon,Degisiklikler,Tarih';
  const escCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = logs.map((log) =>
    [
      log.id,
      escCsv(log.user.fullName),
      escCsv(log.user.email),
      escCsv(log.recordType),
      log.recordId,
      escCsv(log.action),
      escCsv(log.changes ? JSON.stringify(log.changes) : ''),
      escCsv(log.createdAt.toISOString()),
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
  res.send(csv);
}
