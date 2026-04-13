import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.isActive !== undefined) {
    where.isActive = req.query.isActive === 'true';
  }
  if (req.query.role) {
    where.role = req.query.role;
  }
  if (req.query.search) {
    where.OR = [
      { fullName: { contains: String(req.query.search), mode: 'insensitive' } },
      { email: { contains: String(req.query.search), mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip,
      take: pageSize,
      orderBy: { fullName: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, pageSize, skip }));
}

export async function create(req: Request, res: Response) {
  const { email, password, fullName, role, phone, avatarUrl } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Bu e-posta adresi zaten kullaniliyor', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role || 'USER',
      phone,
      avatarUrl,
    },
    select: userSelect,
  });

  res.status(201).json({ success: true, data: user });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { email, password, fullName, role, phone, avatarUrl } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Kullanici bulunamadi', 404);
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      throw new AppError('Bu e-posta adresi zaten kullaniliyor', 409);
    }
  }

  const data: Record<string, unknown> = {};
  if (email) data.email = email;
  if (fullName) data.fullName = fullName;
  if (role) data.role = role;
  if (phone !== undefined) data.phone = phone;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });

  res.json({ success: true, data: user });
}

export async function deactivate(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Kullanici bulunamadi', 404);
  }

  if (id === req.user!.userId) {
    throw new AppError('Kendi hesabinizi deaktif edemezsiniz', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: userSelect,
  });

  res.json({ success: true, data: user });
}
