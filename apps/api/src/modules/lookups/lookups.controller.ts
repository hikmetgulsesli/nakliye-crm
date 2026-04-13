import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

export async function listAll(_req: Request, res: Response) {
  const lookups = await prisma.lookupValue.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
  });

  // Group by category
  const grouped: Record<string, typeof lookups> = {};
  for (const lookup of lookups) {
    if (!grouped[lookup.category]) grouped[lookup.category] = [];
    grouped[lookup.category].push(lookup);
  }

  res.json({ success: true, data: grouped });
}

export async function listByCategory(req: Request, res: Response) {
  const { category } = req.params;
  const includeInactive = req.query.includeInactive === 'true';

  const where: Record<string, unknown> = { category };
  if (!includeInactive) where.isActive = true;

  const lookups = await prisma.lookupValue.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
  });

  res.json({ success: true, data: lookups });
}

export async function create(req: Request, res: Response) {
  const { category, value, sortOrder } = req.body;

  const existing = await prisma.lookupValue.findUnique({
    where: { category_value: { category, value } },
  });
  if (existing) {
    throw new AppError('Bu kategori ve deger kombinasyonu zaten mevcut', 409);
  }

  const lookup = await prisma.lookupValue.create({
    data: {
      category,
      value,
      sortOrder: sortOrder ?? 0,
    },
  });

  res.status(201).json({ success: true, data: lookup });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { value, sortOrder } = req.body;

  const existing = await prisma.lookupValue.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Deger bulunamadi', 404);
  }

  const data: Record<string, unknown> = {};
  if (value !== undefined) data.value = value;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const lookup = await prisma.lookupValue.update({
    where: { id },
    data,
  });

  res.json({ success: true, data: lookup });
}

export async function toggle(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.lookupValue.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Deger bulunamadi', 404);
  }

  const lookup = await prisma.lookupValue.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  res.json({ success: true, data: lookup });
}

export async function reorder(req: Request, res: Response) {
  const { items } = req.body; // [{ id: number, sortOrder: number }]

  if (!Array.isArray(items)) {
    throw new AppError('items dizisi gerekli', 400);
  }

  await prisma.$transaction(
    items.map((item: { id: number; sortOrder: number }) =>
      prisma.lookupValue.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  res.json({ success: true, message: 'Siralama guncellendi' });
}
