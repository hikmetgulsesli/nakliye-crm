import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { parsePagination, paginatedResponse, parseSort } from '../../utils/pagination';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';
import { canTransition, isValidStatus, allowedNextStatuses } from './state-machine';
import { generateShipmentNumber } from './shipments.service';

export async function list(req: Request, res: Response) {
  const p = parsePagination(req.query);
  const where: Record<string, unknown> = { isDeleted: false };
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.customerId) where.customerId = Number(req.query.customerId);
  if (req.query.assignedUserId) where.assignedUserId = Number(req.query.assignedUserId);
  if (req.query.quotationId) where.quotationId = Number(req.query.quotationId);
  if (req.query.search) {
    const s = String(req.query.search);
    where.OR = [
      { shipmentNo: { contains: s, mode: 'insensitive' } },
      { blNumber: { contains: s, mode: 'insensitive' } },
      { awbNumber: { contains: s, mode: 'insensitive' } },
    ];
  }
  // createdAt aralik filtresi (ISO YYYY-MM-DD). Inclusive: bitis tarihinin
  // sonuna kadar; UI'daki tarih aralik filtresinden gelir.
  if (req.query.startDate || req.query.endDate) {
    const range: Record<string, Date> = {};
    if (req.query.startDate) range.gte = new Date(String(req.query.startDate));
    if (req.query.endDate) {
      const end = new Date(String(req.query.endDate));
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    where.createdAt = range;
  }

  const orderBy = parseSort(req.query as Record<string, unknown>, {
    allowedFields: [
      'createdAt',
      'shipmentNo',
      'status',
      'eta',
      'etd',
    ] as const,
    defaultField: 'createdAt',
  });

  const [data, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      skip: p.skip,
      take: p.pageSize,
      orderBy,
      include: {
        customer: { select: { id: true, companyName: true } },
        _count: { select: { containers: true, events: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, p));
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true, phone: true, email: true } },
      containers: true,
      events: { orderBy: { occurredAt: 'desc' }, take: 50 },
    },
  });
  if (!shipment || shipment.isDeleted) throw new AppError('Sevkiyat bulunamadı', 404);
  res.json({
    success: true,
    data: { ...shipment, allowedNextStatuses: allowedNextStatuses(shipment.status) },
  });
}

export async function create(req: Request, res: Response) {
  const body = req.body as {
    customerId: number;
    quotationId?: number;
    transportMode?: string;
    serviceType?: string;
    originCountry?: string;
    pol?: string;
    destinationCountry?: string;
    pod?: string;
    pickupAddress?: string;
    etd?: string;
    eta?: string;
    assignedUserId?: number;
    notes?: string;
    blNumber?: string;
    awbNumber?: string;
  };

  if (!body.customerId) throw new AppError('customerId zorunlu', 400);

  const shipmentNo = await generateShipmentNumber();
  // pickupAddress yeni alan — Prisma client generate olana kadar tipte
  // gorunmeyebilir; runtime'da problem olmaz (migration alani ekledi).
  const createData = {
    shipmentNo,
    customerId: body.customerId,
    quotationId: body.quotationId,
    transportMode: body.transportMode,
    serviceType: body.serviceType,
    originCountry: body.originCountry,
    pol: body.pol,
    destinationCountry: body.destinationCountry,
    pod: body.pod,
    pickupAddress: body.pickupAddress,
    etd: body.etd ? new Date(body.etd) : undefined,
    eta: body.eta ? new Date(body.eta) : undefined,
    notes: body.notes,
    blNumber: body.blNumber,
    awbNumber: body.awbNumber,
    status: 'draft',
    assignedUserId: body.assignedUserId ?? req.user!.userId,
    createdById: req.user!.userId,
  } as Parameters<typeof prisma.shipment.create>[0]['data'];
  const shipment = await prisma.shipment.create({ data: createData });

  await prisma.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      eventType: 'status_change',
      toStatus: 'draft',
      note: 'Sevkiyat oluşturuldu',
      occurredAt: new Date(),
      createdById: req.user!.userId,
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Shipment',
    recordId: shipment.id,
    action: 'CREATE',
  });

  // Musteri zaman cizelgesine: "yeni sevkiyat olusturuldu" + lastContactDate
  try {
    const { logShipmentCreatedActivity } = await import('../../utils/activity-from-update');
    const creator = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    await logShipmentCreatedActivity({
      customerId: shipment.customerId,
      shipmentNo: shipment.shipmentNo,
      byUserId: req.user!.userId,
      byUserName: creator?.fullName,
    });
  } catch (err) {
    const { logger } = await import('../../config/logger');
    logger.warn({ err: (err as Error).message, shipmentId: shipment.id }, 'Activity log basarisiz');
  }

  res.status(201).json({ success: true, data: shipment });
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.shipment.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) throw new AppError('Sevkiyat bulunamadı', 404);

  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const allowed = [
    'blNumber', 'awbNumber', 'transportMode', 'serviceType', 'originCountry',
    'pol', 'destinationCountry', 'pod', 'pickupAddress', 'notes',
    'assignedUserId', 'customsStatus',
  ];
  for (const k of allowed) if (k in b) data[k] = b[k];
  if (b.etd) data.etd = new Date(String(b.etd));
  if (b.eta) data.eta = new Date(String(b.eta));
  if (b.atd) data.atd = new Date(String(b.atd));
  if (b.ata) data.ata = new Date(String(b.ata));

  const updated = await prisma.shipment.update({ where: { id }, data });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Shipment',
    recordId: id,
    action: 'UPDATE',
  });

  res.json({ success: true, data: updated });
}

export async function changeStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { toStatus, note, location } = req.body as {
    toStatus: string;
    note?: string;
    location?: string;
  };

  if (!isValidStatus(toStatus)) throw new AppError('Geçersiz durum', 400);

  const existing = await prisma.shipment.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) throw new AppError('Sevkiyat bulunamadı', 404);

  if (!canTransition(existing.status, toStatus)) {
    throw new AppError(
      `${existing.status} → ${toStatus} geçişine izin verilmiyor (allowed: ${allowedNextStatuses(existing.status).join(', ') || 'none'})`,
      400,
    );
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: toStatus };
  if (toStatus === 'in_transit' && !existing.atd) data.atd = now;
  if (toStatus === 'at_destination' && !existing.ata) data.ata = now;

  const [updated] = await prisma.$transaction([
    prisma.shipment.update({ where: { id }, data }),
    prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        eventType: 'status_change',
        fromStatus: existing.status,
        toStatus,
        note,
        location,
        occurredAt: now,
        createdById: req.user!.userId,
      },
    }),
  ]);

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Shipment',
    recordId: id,
    action: 'UPDATE',
    changes: { status: { old: existing.status, new: toStatus } },
  });

  // Musteri zaman cizelgesine: sevkiyat statu degisimi + lastContactDate
  try {
    const { logShipmentStatusChangedActivity } = await import('../../utils/activity-from-update');
    const editor = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    await logShipmentStatusChangedActivity({
      customerId: existing.customerId,
      shipmentNo: existing.shipmentNo,
      oldStatus: existing.status,
      newStatus: toStatus,
      byUserId: req.user!.userId,
      byUserName: editor?.fullName,
    });
  } catch (err) {
    const { logger } = await import('../../config/logger');
    logger.warn({ err: (err as Error).message, shipmentId: id }, 'Status activity log basarisiz');
  }

  res.json({ success: true, data: updated });
}

export async function addContainer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment || shipment.isDeleted) throw new AppError('Sevkiyat bulunamadı', 404);

  const { containerNo, sealNo, type, weightKg } = req.body as {
    containerNo: string;
    sealNo?: string;
    type?: string;
    weightKg?: number;
  };
  if (!containerNo) throw new AppError('containerNo zorunlu', 400);

  const c = await prisma.container.create({
    data: { shipmentId: id, containerNo, sealNo, type, weightKg },
  });
  res.status(201).json({ success: true, data: c });
}

export async function removeContainer(req: Request, res: Response) {
  const containerId = Number(req.params.containerId);
  await prisma.container.delete({ where: { id: containerId } });
  res.json({ success: true });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.shipment.update({
    where: { id },
    data: { isDeleted: true },
  });
  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Shipment',
    recordId: id,
    action: 'DELETE',
  });
  res.json({ success: true });
}
