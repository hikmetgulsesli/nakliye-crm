import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { createAuditLog } from '../../utils/audit';
import { computeDiff } from '../../utils/diff';

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.potential) where.potential = req.query.potential;
  if (req.query.assignedUserId) where.assignedUserId = parseInt(String(req.query.assignedUserId), 10);
  if (req.query.direction) where.direction = req.query.direction;
  if (req.query.source) where.source = req.query.source;

  // JSON array contains filters
  if (req.query.transportMode) {
    where.transportModes = { array_contains: req.query.transportMode };
  }
  if (req.query.serviceType) {
    where.serviceTypes = { array_contains: req.query.serviceType };
  }
  if (req.query.originCountry) {
    where.originCountries = { array_contains: req.query.originCountry };
  }
  if (req.query.destinationCountry) {
    where.destinationCountries = { array_contains: req.query.destinationCountry };
  }
  if (req.query.incoterm) {
    where.incoterms = { array_contains: req.query.incoterm };
  }

  // Date range filter
  if (req.query.dateFrom || req.query.dateTo) {
    where.createdAt = {};
    if (req.query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  if (req.query.search) {
    const search = String(req.query.search);
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  // PRD v3: tüm kullanıcılar tüm müşterileri görebilir (çakışma onleme için kritik)

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, fullName: true } },
      },
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, pageSize, skip }));
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const customer = await prisma.customer.findFirst({
    where: { id },
    include: {
      assignedUser: { select: { id: true, fullName: true, email: true } },
      createdBy: { select: { id: true, fullName: true } },
      quotations: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      activities: {
        where: { isDeleted: false },
        orderBy: { activityDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    throw new AppError('Müşteri bulunamadı', 404);
  }

  // PRD v3: tüm kullanıcılar tüm müşterileri görebilir
  res.json({ success: true, data: customer });
}

export async function create(req: Request, res: Response) {
  const {
    companyName, contactName, phone, email, address,
    transportModes, serviceTypes, incoterms, direction,
    originCountries, destinationCountries, source, potential,
    status, notes, assignedUserId,
  } = req.body;

  const customer = await prisma.customer.create({
    data: {
      companyName,
      contactName,
      phone,
      email,
      address,
      transportModes,
      serviceTypes,
      incoterms,
      direction,
      originCountries,
      destinationCountries,
      source,
      potential,
      status: status || 'Aktif',
      notes,
      assignedUserId: assignedUserId || req.user!.userId,
      createdById: req.user!.userId,
    },
    include: {
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Customer',
    recordId: customer.id,
    action: 'CREATE',
  });

  res.status(201).json({ success: true, data: customer });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.customer.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Müşteri bulunamadı', 404);
  }

  if (req.user!.role !== 'ADMIN' && existing.assignedUserId !== req.user!.userId) {
    throw new AppError('Bu müşteri için yetkiniz yok', 403);
  }

  const {
    companyName, contactName, phone, email, address,
    transportModes, serviceTypes, incoterms, direction,
    originCountries, destinationCountries, source, potential,
    status, notes, assignedUserId,
  } = req.body;

  const updateData: Record<string, unknown> = {};
  if (companyName !== undefined) updateData.companyName = companyName;
  if (contactName !== undefined) updateData.contactName = contactName;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (transportModes !== undefined) updateData.transportModes = transportModes;
  if (serviceTypes !== undefined) updateData.serviceTypes = serviceTypes;
  if (incoterms !== undefined) updateData.incoterms = incoterms;
  if (direction !== undefined) updateData.direction = direction;
  if (originCountries !== undefined) updateData.originCountries = originCountries;
  if (destinationCountries !== undefined) updateData.destinationCountries = destinationCountries;
  if (source !== undefined) updateData.source = source;
  if (potential !== undefined) updateData.potential = potential;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (assignedUserId !== undefined && req.user!.role === 'ADMIN') {
    updateData.assignedUserId = assignedUserId;
  }

  const changes = computeDiff(existing as unknown as Record<string, unknown>, updateData);

  const customer = await prisma.customer.update({
    where: { id },
    data: updateData,
    include: {
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Customer',
    recordId: id,
    action: 'UPDATE',
    changes,
  });

  res.json({ success: true, data: customer });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.customer.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Müşteri bulunamadı', 404);
  }

  // Soft delete via middleware
  await prisma.customer.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Customer',
    recordId: id,
    action: 'DELETE',
  });

  res.json({ success: true, message: 'Müşteri silindi' });
}

export async function restore(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.customer.findFirst({
    where: { id, isDeleted: true },
  });
  if (!existing) {
    throw new AppError('Silinmiş müşteri bulunamadı', 404);
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: { isDeleted: false },
    include: {
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Customer',
    recordId: id,
    action: 'RESTORE',
  });

  res.json({ success: true, data: customer });
}
