import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/audit';

// Bu tipler "musteriye ulasildi" anlamina gelmez — gelen kanallar veya
// cevapsiz cagri. Activity yine olusur, ama lastContactDate yerine
// lastInboundAt'i tetikler.
const NON_REACHED_TYPES = new Set<string>([
  'Telefon (cevapsız)',
  'E-posta (gelen)',
  'WhatsApp (gelen)',
]);

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.customerId) where.customerId = parseInt(String(req.query.customerId), 10);
  if (req.query.activityType) where.activityType = req.query.activityType;
  if (req.query.outcome) where.outcome = req.query.outcome;

  // PRD v3: tüm kullanıcılar tüm aktiviteleri görebilir (dashboard "Son Aktiviteler" seffafligi)
  if (req.query.createdById) {
    where.createdById = parseInt(String(req.query.createdById), 10);
  }

  if (req.query.dateFrom || req.query.dateTo) {
    where.activityDate = {};
    if (req.query.dateFrom) (where.activityDate as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.activityDate as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  const [data, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      skip,
      take: pageSize,
      orderBy: { activityDate: 'desc' },
    }),
    prisma.activity.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, pageSize, skip }));
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const activity = await prisma.activity.findFirst({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  if (!activity) {
    throw new AppError('Aktivite bulunamadı', 404);
  }

  // PRD v3: tüm kullanıcılar tüm aktiviteleri görebilir
  res.json({ success: true, data: activity });
}

export async function create(req: Request, res: Response) {
  const {
    customerId, activityType, activityDate, durationMinutes,
    notes, outcome, nextActionDate,
  } = req.body;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({ where: { id: customerId } });
  if (!customer) {
    throw new AppError('Müşteri bulunamadı', 404);
  }

  const activity = await prisma.activity.create({
    data: {
      customerId,
      activityType,
      activityDate: new Date(activityDate),
      durationMinutes,
      notes,
      outcome,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
      createdById: req.user!.userId,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  // "Bizim aktif aksiyon aldigimiz ve gercekten musteriye ulastigimiz"
  // aktiviteler lastContactDate'i guncellesin. Cevapsiz cagri ve gelen
  // mesajlar lastInboundAt sayilir; KPI ve aranmayan-musteri alarmini
  // bozmamasi icin ayri tutuyoruz.
  const isReached = !NON_REACHED_TYPES.has(activityType);
  await prisma.customer.update({
    where: { id: customerId },
    data: isReached
      ? { lastContactDate: new Date(activityDate) }
      : { lastInboundAt: new Date(activityDate) },
  });

  // Gercek bir gorusme yapildiysa, ayni musterinin bugun veya gecmiste
  // planlanmis bekleyen follow-up'larinin nextActionDate'ini sifirla —
  // "Bugun bunlarla konus" listesinde tekrar gorunmesin.
  if (isReached) {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    await prisma.activity.updateMany({
      where: {
        customerId,
        isDeleted: false,
        id: { not: activity.id },
        nextActionDate: { lte: todayEnd, not: null },
      },
      data: { nextActionDate: null },
    });
  }

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Activity',
    recordId: activity.id,
    action: 'CREATE',
  });

  res.status(201).json({ success: true, data: activity });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.activity.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Aktivite bulunamadı', 404);
  }

  if (req.user!.role !== 'ADMIN' && existing.createdById !== req.user!.userId) {
    throw new AppError('Bu aktivite için yetkiniz yok', 403);
  }

  const {
    activityType, activityDate, durationMinutes,
    notes, outcome, nextActionDate,
  } = req.body;

  const updateData: Record<string, unknown> = {};
  if (activityType !== undefined) updateData.activityType = activityType;
  if (activityDate !== undefined) updateData.activityDate = new Date(activityDate);
  if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
  if (notes !== undefined) updateData.notes = notes;
  if (outcome !== undefined) updateData.outcome = outcome;
  if (nextActionDate !== undefined) updateData.nextActionDate = nextActionDate ? new Date(nextActionDate) : null;

  const activity = await prisma.activity.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, companyName: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Activity',
    recordId: id,
    action: 'UPDATE',
  });

  res.json({ success: true, data: activity });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.activity.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Aktivite bulunamadı', 404);
  }

  if (req.user!.role !== 'ADMIN' && existing.createdById !== req.user!.userId) {
    throw new AppError('Bu aktivite için yetkiniz yok', 403);
  }

  await prisma.activity.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Activity',
    recordId: id,
    action: 'DELETE',
  });

  res.json({ success: true, message: 'Aktivite silindi' });
}

export async function restore(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.activity.findFirst({
    where: { id, isDeleted: true },
  });
  if (!existing) {
    throw new AppError('Silinmiş aktivite bulunamadı', 404);
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: { isDeleted: false },
    include: {
      customer: { select: { id: true, companyName: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Activity',
    recordId: id,
    action: 'RESTORE',
  });

  res.json({ success: true, data: activity });
}
