import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

// ==================== Carriers ====================

export async function listCarriers(_req: Request, res: Response) {
  const rows = await prisma.carrier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { rates: true } } },
  });
  res.json({ success: true, data: rows });
}

export async function createCarrier(req: Request, res: Response) {
  const { name, code, modes } = req.body as {
    name: string;
    code?: string;
    modes?: string[];
  };
  if (!name) throw new AppError('name gerekli', 400);
  const c = await prisma.carrier.create({
    data: { name, code, modes: modes as unknown as object },
  });
  res.status(201).json({ success: true, data: c });
}

export async function updateCarrier(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name, code, modes, isActive } = req.body as {
    name?: string;
    code?: string;
    modes?: string[];
    isActive?: boolean;
  };
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (code !== undefined) data.code = code;
  if (modes !== undefined) data.modes = modes;
  if (isActive !== undefined) data.isActive = isActive;
  const c = await prisma.carrier.update({ where: { id }, data });
  res.json({ success: true, data: c });
}

export async function removeCarrier(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.carrier.delete({ where: { id } });
  res.json({ success: true });
}

// ==================== Rates ====================

export async function listRates(req: Request, res: Response) {
  const p = parsePagination(req.query);
  const where: Record<string, unknown> = {};
  if (req.query.carrierId) where.carrierId = Number(req.query.carrierId);
  if (req.query.transportMode) where.transportMode = String(req.query.transportMode);
  if (req.query.originCountry) where.originCountry = String(req.query.originCountry);
  if (req.query.destinationCountry) where.destinationCountry = String(req.query.destinationCountry);
  if (req.query.activeOnly === 'true') {
    where.isActive = true;
    where.OR = [
      { validUntil: null },
      { validUntil: { gte: new Date() } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.rate.findMany({
      where,
      skip: p.skip,
      take: p.pageSize,
      orderBy: [{ validFrom: 'desc' }, { basePrice: 'asc' }],
      include: { carrier: { select: { id: true, name: true, code: true } } },
    }),
    prisma.rate.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, p));
}

export async function createRate(req: Request, res: Response) {
  const b = req.body as {
    carrierId: number;
    transportMode: string;
    serviceType?: string;
    originCountry?: string;
    pol?: string;
    destinationCountry?: string;
    pod?: string;
    basePrice: number;
    currency?: string;
    validFrom?: string;
    validUntil?: string;
    notes?: string;
  };

  if (!b.carrierId || !b.transportMode || !b.basePrice) {
    throw new AppError('carrierId, transportMode, basePrice zorunlu', 400);
  }

  const rate = await prisma.rate.create({
    data: {
      carrierId: b.carrierId,
      transportMode: b.transportMode,
      serviceType: b.serviceType,
      originCountry: b.originCountry,
      pol: b.pol,
      destinationCountry: b.destinationCountry,
      pod: b.pod,
      basePrice: b.basePrice,
      currency: b.currency || 'USD',
      validFrom: b.validFrom ? new Date(b.validFrom) : new Date(),
      validUntil: b.validUntil ? new Date(b.validUntil) : null,
      notes: b.notes,
      createdById: req.user!.userId,
    },
  });
  res.status(201).json({ success: true, data: rate });
}

export async function updateRate(req: Request, res: Response) {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const allowed = [
    'transportMode',
    'serviceType',
    'originCountry',
    'pol',
    'destinationCountry',
    'pod',
    'basePrice',
    'currency',
    'notes',
    'isActive',
  ];
  for (const k of allowed) if (k in b) data[k] = b[k];
  if (b.validFrom) data.validFrom = new Date(String(b.validFrom));
  if (b.validUntil) data.validUntil = new Date(String(b.validUntil));

  const rate = await prisma.rate.update({ where: { id }, data });
  res.json({ success: true, data: rate });
}

export async function removeRate(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.rate.delete({ where: { id } });
  res.json({ success: true });
}

/**
 * Teklif olustururken musterinin origin+destination+mode secimine uygun
 * aktif rate'leri doner.
 */
export async function suggestRates(req: Request, res: Response) {
  const { transportMode, originCountry, destinationCountry } = req.query as {
    transportMode?: string;
    originCountry?: string;
    destinationCountry?: string;
  };
  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { validUntil: null },
      { validUntil: { gte: new Date() } },
    ],
  };
  if (transportMode) where.transportMode = transportMode;
  if (originCountry) where.originCountry = originCountry;
  if (destinationCountry) where.destinationCountry = destinationCountry;

  const rates = await prisma.rate.findMany({
    where,
    orderBy: { basePrice: 'asc' },
    include: { carrier: { select: { id: true, name: true } } },
    take: 20,
  });
  res.json({ success: true, data: rates });
}
