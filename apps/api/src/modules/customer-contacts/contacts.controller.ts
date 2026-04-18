import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

export async function list(req: Request, res: Response) {
  const customerId = Number(req.query.customerId);
  if (!customerId) throw new AppError('customerId gerekli', 400);
  const contacts = await prisma.customerContact.findMany({
    where: { customerId },
    orderBy: [{ isPrimary: 'desc' }, { fullName: 'asc' }],
  });
  res.json({ success: true, data: contacts });
}

export async function create(req: Request, res: Response) {
  const { customerId, fullName, role, phone, email, birthdate, notes, isPrimary } = req.body as {
    customerId: number;
    fullName: string;
    role?: string;
    phone?: string;
    email?: string;
    birthdate?: string;
    notes?: string;
    isPrimary?: boolean;
  };
  if (!customerId || !fullName) throw new AppError('customerId + fullName zorunlu', 400);

  // Primary toggle'i: baska primary varsa unset et
  if (isPrimary) {
    await prisma.customerContact.updateMany({
      where: { customerId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.customerContact.create({
    data: {
      customerId,
      fullName,
      role,
      phone,
      email,
      birthdate: birthdate ? new Date(birthdate) : undefined,
      notes,
      isPrimary: isPrimary ?? false,
    },
  });
  res.status(201).json({ success: true, data: contact });
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.customerContact.findUnique({ where: { id } });
  if (!existing) throw new AppError('Yetkili bulunamadı', 404);

  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of ['fullName', 'role', 'phone', 'email', 'notes', 'isPrimary']) {
    if (k in b) data[k] = b[k];
  }
  if (b.birthdate) data.birthdate = new Date(String(b.birthdate));

  if (b.isPrimary === true) {
    await prisma.customerContact.updateMany({
      where: { customerId: existing.customerId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.customerContact.update({ where: { id }, data });
  res.json({ success: true, data: updated });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.customerContact.delete({ where: { id } });
  res.json({ success: true });
}

/**
 * Yaklasan dogum gunleri — bugun + N gun (default 14).
 * ay-gun bazli bakilir (yil onemsiz).
 */
export async function upcomingBirthdays(req: Request, res: Response) {
  const daysAhead = Math.min(60, Number(req.query.days ?? 14));
  const rows = await prisma.customerContact.findMany({
    where: { birthdate: { not: null } },
    include: { customer: { select: { id: true, companyName: true, assignedUserId: true } } },
  });

  const now = new Date();
  const todayMd = (now.getMonth() + 1) * 100 + now.getDate(); // MMDD
  const upcoming = rows
    .map((c) => {
      const b = c.birthdate!;
      const md = (b.getMonth() + 1) * 100 + b.getDate();
      // Yil dondurme: gunluk diff
      const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
      const nextOccur = thisYear < new Date(now.getFullYear(), now.getMonth(), now.getDate())
        ? new Date(now.getFullYear() + 1, b.getMonth(), b.getDate())
        : thisYear;
      const diffDays = Math.floor((nextOccur.getTime() - now.getTime()) / 86400000);
      return { ...c, md, diffDays };
    })
    .filter((c) => c.diffDays <= daysAhead)
    .sort((a, b) => a.diffDays - b.diffDays);

  res.json({ success: true, data: upcoming });
}
