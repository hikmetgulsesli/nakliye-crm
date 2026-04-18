import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

const VALID_RESOURCES = ['customers', 'quotations', 'shipments', 'activities'];

export async function list(req: Request, res: Response) {
  const { resource } = req.query as { resource?: string };
  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (resource) where.resource = resource;

  const views = await prisma.savedView.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { name: 'asc' }],
  });
  res.json({ success: true, data: views });
}

export async function create(req: Request, res: Response) {
  const { name, resource, filters, isPinned } = req.body as {
    name: string;
    resource: string;
    filters: Record<string, unknown>;
    isPinned?: boolean;
  };
  if (!name || !resource) throw new AppError('name + resource gerekli', 400);
  if (!VALID_RESOURCES.includes(resource)) throw new AppError('Gecersiz resource', 400);

  const view = await prisma.savedView.create({
    data: {
      userId: req.user!.userId,
      name,
      resource,
      filters: filters as object,
      isPinned: isPinned ?? false,
    },
  });
  res.status(201).json({ success: true, data: view });
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.savedView.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.userId) {
    throw new AppError('Görünüm bulunamadı', 404);
  }
  const { name, filters, isPinned } = req.body as {
    name?: string;
    filters?: Record<string, unknown>;
    isPinned?: boolean;
  };
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (filters !== undefined) data.filters = filters;
  if (isPinned !== undefined) data.isPinned = isPinned;

  const view = await prisma.savedView.update({ where: { id }, data });
  res.json({ success: true, data: view });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.savedView.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.userId) {
    throw new AppError('Görünüm bulunamadı', 404);
  }
  await prisma.savedView.delete({ where: { id } });
  res.json({ success: true });
}
