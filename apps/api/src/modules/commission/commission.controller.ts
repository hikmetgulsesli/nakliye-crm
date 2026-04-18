import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { convertToTRY } from '../../services/exchange-rates/tcmb.service';

/**
 * Kazanilan tekliflerden kullanicinin komisyonunu hesaplar.
 * Kural oncelik: kullaniciya ozgul aktif > genel aktif.
 */
async function findApplicableRule(userId: number, date: Date) {
  // Kullaniciya ozgul
  const specific = await prisma.commissionRule.findFirst({
    where: {
      userId,
      isActive: true,
      validFrom: { lte: date },
      OR: [{ validUntil: null }, { validUntil: { gte: date } }],
    },
    orderBy: { validFrom: 'desc' },
  });
  if (specific) return specific;
  return prisma.commissionRule.findFirst({
    where: {
      userId: null,
      isActive: true,
      validFrom: { lte: date },
      OR: [{ validUntil: null }, { validUntil: { gte: date } }],
    },
    orderBy: { validFrom: 'desc' },
  });
}

export async function myCommission(req: Request, res: Response) {
  const userId = req.user!.userId;
  const month = req.query.month ? String(req.query.month) : null; // YYYY-MM

  const now = new Date();
  const start = month
    ? new Date(`${month}-01T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const won = await prisma.quotation.findMany({
    where: {
      assignedUserId: userId,
      status: 'Kazanıldı',
      isDeleted: false,
      updatedAt: { gte: start, lt: end },
    },
    select: { id: true, quoteNo: true, price: true, currency: true, updatedAt: true },
  });

  let totalTRY = 0;
  let totalCommissionTRY = 0;
  const breakdown: Array<{
    quotationId: number;
    quoteNo: string;
    price: number;
    currency: string;
    priceTRY: number;
    percent: number;
    commissionTRY: number;
  }> = [];

  for (const q of won) {
    const price = Number(q.price || 0);
    if (!price) continue;
    const rule = await findApplicableRule(userId, q.updatedAt);
    const percent = rule?.percent ?? 0;
    const { try: priceTRY } = await convertToTRY(price, q.currency || 'USD');
    const commissionTRY = (priceTRY * percent) / 100;
    totalTRY += priceTRY;
    totalCommissionTRY += commissionTRY;
    breakdown.push({
      quotationId: q.id,
      quoteNo: q.quoteNo,
      price,
      currency: q.currency || '',
      priceTRY,
      percent,
      commissionTRY,
    });
  }

  res.json({
    success: true,
    data: {
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      wonCount: won.length,
      totalRevenueTRY: totalTRY,
      totalCommissionTRY,
      breakdown,
    },
  });
}

// ============ Rules CRUD (admin) ============

export async function listRules(_req: Request, res: Response) {
  const rules = await prisma.commissionRule.findMany({
    orderBy: [{ isActive: 'desc' }, { validFrom: 'desc' }],
  });
  res.json({ success: true, data: rules });
}

export async function createRule(req: Request, res: Response) {
  const { name, userId, percent, minAmount, maxAmount, currency, validFrom, validUntil } =
    req.body as {
      name: string;
      userId?: number;
      percent: number;
      minAmount?: number;
      maxAmount?: number;
      currency?: string;
      validFrom: string;
      validUntil?: string;
    };
  if (!name || percent == null || !validFrom) throw new AppError('Gerekli alanlar eksik', 400);
  const rule = await prisma.commissionRule.create({
    data: {
      name,
      userId,
      percent,
      minAmount,
      maxAmount,
      currency,
      validFrom: new Date(validFrom),
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });
  res.status(201).json({ success: true, data: rule });
}

export async function updateRule(req: Request, res: Response) {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of ['name', 'userId', 'percent', 'minAmount', 'maxAmount', 'currency', 'isActive']) {
    if (k in b) data[k] = b[k];
  }
  if (b.validFrom) data.validFrom = new Date(String(b.validFrom));
  if (b.validUntil !== undefined)
    data.validUntil = b.validUntil ? new Date(String(b.validUntil)) : null;
  const rule = await prisma.commissionRule.update({ where: { id }, data });
  res.json({ success: true, data: rule });
}

export async function removeRule(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.commissionRule.delete({ where: { id } });
  res.json({ success: true });
}
