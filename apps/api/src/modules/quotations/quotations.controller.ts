import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { parsePagination, paginatedResponse, parseSort } from '../../utils/pagination';
import { generateQuoteNumber } from '../../utils/quote-number';
import { computeDiff } from '../../utils/diff';
import { createAuditLog } from '../../utils/audit';
import {
  logQuotationUpdateActivity,
  logQuotationCreatedActivity,
  logQuotationStatusChangedActivity,
} from '../../utils/activity-from-update';

export async function list(req: Request, res: Response) {
  const { skip, page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const where: Record<string, unknown> = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.customerId) where.customerId = parseInt(String(req.query.customerId), 10);
  if (req.query.assignedUserId) where.assignedUserId = parseInt(String(req.query.assignedUserId), 10);
  if (req.query.transportMode) where.transportMode = req.query.transportMode;
  if (req.query.originCountry) where.originCountry = req.query.originCountry;
  if (req.query.destinationCountry) where.destinationCountry = req.query.destinationCountry;
  if (req.query.serviceType) where.serviceType = req.query.serviceType;
  if (req.query.incoterm) where.incoterm = req.query.incoterm;
  if (req.query.currency) where.currency = req.query.currency;

  // Date range filter on quoteDate
  if (req.query.dateFrom || req.query.dateTo) {
    where.quoteDate = {};
    if (req.query.dateFrom) (where.quoteDate as Record<string, unknown>).gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) (where.quoteDate as Record<string, unknown>).lte = new Date(String(req.query.dateTo));
  }

  // "N+ gundur bekleyen" — dashboard alarm tiklamasi icin
  if (req.query.olderThanDays) {
    const days = parseInt(String(req.query.olderThanDays), 10);
    if (!Number.isNaN(days) && days > 0) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      where.createdAt = { ...(where.createdAt as Record<string, unknown> | undefined), lt: threshold };
    }
  }

  // "Suresi dolan teklifler" — validityDate gecmis olanlar
  if (req.query.expired === 'true' || req.query.expired === '1') {
    where.validityDate = { lt: new Date() };
  }

  if (req.query.search) {
    const search = String(req.query.search);
    where.OR = [
      { quoteNo: { contains: search, mode: 'insensitive' } },
      { customer: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // PRD v3: tüm kullanıcılar tüm teklifleri görebilir (şeffaflık)

  const orderBy = parseSort(req.query as Record<string, unknown>, {
    allowedFields: [
      'createdAt',
      'quoteDate',
      'quoteNo',
      'price',
      'status',
      'validityDate',
    ] as const,
    defaultField: 'createdAt',
  });

  const [data, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true } },
        assignedUser: { select: { id: true, fullName: true } },
      },
      skip,
      take: pageSize,
      orderBy,
    }),
    prisma.quotation.count({ where }),
  ]);

  res.json(paginatedResponse(data, total, { page, pageSize, skip }));
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const quotation = await prisma.quotation.findFirst({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true, contactName: true } },
      assignedUser: { select: { id: true, fullName: true } },
      createdBy: { select: { id: true, fullName: true } },
      revisions: {
        orderBy: { revisionNo: 'desc' },
        include: { revisedBy: { select: { id: true, fullName: true } } },
      },
    },
  });

  if (!quotation) {
    throw new AppError('Teklif bulunamadı', 404);
  }

  // PRD v3: tüm kullanıcılar tüm teklifleri görebilir
  res.json({ success: true, data: quotation });
}

export async function downloadPdf(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const quotation = await prisma.quotation.findFirst({
    where: { id },
    include: {
      customer: true,
      assignedUser: { select: { fullName: true } },
    },
  });
  if (!quotation) throw new AppError('Teklif bulunamadı', 404);

  const { generateQuotationPdf } = await import('./quotation-pdf.generator');
  const pdf = await generateQuotationPdf({
    quoteNo: quotation.quoteNo,
    quoteDate: quotation.quoteDate,
    validityDate: quotation.validityDate,
    status: quotation.status,
    transportMode: quotation.transportMode,
    serviceType: quotation.serviceType,
    originCountry: quotation.originCountry,
    pol: quotation.pol,
    destinationCountry: quotation.destinationCountry,
    pod: quotation.pod,
    incoterm: quotation.incoterm,
    price: quotation.price ? Number(quotation.price) : null,
    currency: quotation.currency,
    priceNote: quotation.priceNote,
    customer: {
      companyName: quotation.customer.companyName,
      contactName: quotation.customer.contactName,
      taxNumber: quotation.customer.taxNumber,
      taxOffice: quotation.customer.taxOffice,
      phone: quotation.customer.phone,
      email: quotation.customer.email,
      address: quotation.customer.address,
    },
    assignedUserName: quotation.assignedUser?.fullName,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${quotation.quoteNo}.pdf"`,
  );
  res.setHeader('Content-Length', String(pdf.length));
  res.end(pdf);
}

export async function getRevisions(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const quotation = await prisma.quotation.findFirst({ where: { id } });
  if (!quotation) {
    throw new AppError('Teklif bulunamadı', 404);
  }

  // PRD v3: revizyon geçmişi herkese açık
  const revisions = await prisma.quotationRevision.findMany({
    where: { quotationId: id },
    orderBy: { revisionNo: 'desc' },
    include: { revisedBy: { select: { id: true, fullName: true } } },
  });

  res.json({ success: true, data: revisions });
}

export async function create(req: Request, res: Response) {
  const {
    customerId, quoteDate, validityDate, transportMode, serviceType,
    originCountry, pol, destinationCountry, pod, incoterm,
    price, currency, priceNote, status, assignedUserId,
  } = req.body;

  // Verify customer exists
  const customer = await prisma.customer.findFirst({ where: { id: customerId } });
  if (!customer) {
    throw new AppError('Müşteri bulunamadı', 404);
  }

  const quoteNo = await generateQuoteNumber();

  // USER kendi adına kayıt açar; ADMIN istediği temsilciye atayabilir.
  const effectiveAssignedUserId =
    req.user!.role === 'ADMIN' && assignedUserId ? assignedUserId : req.user!.userId;

  const quotation = await prisma.quotation.create({
    data: {
      quoteNo,
      customerId,
      quoteDate: new Date(quoteDate),
      validityDate: new Date(validityDate),
      transportMode,
      serviceType,
      originCountry,
      pol,
      destinationCountry,
      pod,
      incoterm,
      price,
      currency: currency || 'USD',
      priceNote,
      status: status || 'Bekliyor',
      assignedUserId: effectiveAssignedUserId,
      createdById: req.user!.userId,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  // Update customer's lastQuoteDate
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastQuoteDate: new Date() },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Quotation',
    recordId: quotation.id,
    action: 'CREATE',
  });

  // Musteri zaman cizelgesine: "yeni teklif olusturuldu" + lastContactDate
  try {
    const creator = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    await logQuotationCreatedActivity({
      customerId,
      quoteNo,
      byUserId: req.user!.userId,
      byUserName: creator?.fullName,
    });
  } catch (err) {
    const { logger } = await import('../../config/logger');
    logger.warn({ err: (err as Error).message, quotationId: quotation.id }, 'Activity log basarisiz');
  }

  // Yeni teklif dogrudan "Kazanildi" statusuyle olusturuldysa shipment hook'u
  // calismali — update'teki ile ayni davranis. Idempotent oldugu icin guvenli.
  if (quotation.status === 'Kazanıldı') {
    try {
      const { createShipmentFromQuotation } = await import('../shipments/shipments.service');
      await createShipmentFromQuotation(quotation.id, req.user!.userId);
    } catch (err) {
      const { logger } = await import('../../config/logger');
      logger.warn(
        { err: (err as Error).message, quotationId: quotation.id },
        'Shipment auto-create (create akisi) basarisiz',
      );
    }
  }

  res.status(201).json({ success: true, data: quotation });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.quotation.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Teklif bulunamadı', 404);
  }

  // Tüm USER'lar her teklifi düzenleyebilir; başkasının kaydında değişiklik
  // yaparlarsa müşterinin aktivite akışına otomatik kayıt düşer (aşağıda).

  const {
    quoteDate, validityDate, transportMode, serviceType,
    originCountry, pol, destinationCountry, pod, incoterm,
    price, currency, priceNote, status, lossReason, assignedUserId,
  } = req.body;

  const updateData: Record<string, unknown> = {};
  if (quoteDate !== undefined) updateData.quoteDate = new Date(quoteDate);
  if (validityDate !== undefined) updateData.validityDate = new Date(validityDate);
  if (transportMode !== undefined) updateData.transportMode = transportMode;
  if (serviceType !== undefined) updateData.serviceType = serviceType;
  if (originCountry !== undefined) updateData.originCountry = originCountry;
  if (pol !== undefined) updateData.pol = pol;
  if (destinationCountry !== undefined) updateData.destinationCountry = destinationCountry;
  if (pod !== undefined) updateData.pod = pod;
  if (incoterm !== undefined) updateData.incoterm = incoterm;
  if (price !== undefined) updateData.price = price;
  if (currency !== undefined) updateData.currency = currency;
  if (priceNote !== undefined) updateData.priceNote = priceNote;
  if (status !== undefined) updateData.status = status;
  if (lossReason !== undefined) updateData.lossReason = lossReason;
  if (assignedUserId !== undefined && req.user!.role === 'ADMIN') {
    updateData.assignedUserId = assignedUserId;
  }

  // Compute diff for revision
  const changes = computeDiff(existing as unknown as Record<string, unknown>, updateData);

  if (changes) {
    // Create revision and increment revisionCount in a transaction
    await prisma.$transaction([
      prisma.quotationRevision.create({
        data: {
          quotationId: id,
          revisionNo: existing.revisionCount + 1,
          changedFields: changes as any,
          revisedById: req.user!.userId,
        },
      }),
      prisma.quotation.update({
        where: { id },
        data: {
          ...updateData,
          revisionCount: { increment: 1 },
        },
      }),
    ]);
  } else {
    await prisma.quotation.update({
      where: { id },
      data: updateData,
    });
  }

  const updated = await prisma.quotation.findFirst({
    where: { id },
    include: {
      customer: { select: { id: true, companyName: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Quotation',
    recordId: id,
    action: 'UPDATE',
    changes,
  });

  // Sahibi olmayan biri düzenlediyse müşterinin aktivite akışına iz bırak.
  if (existing.assignedUserId !== req.user!.userId) {
    const editor = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    await logQuotationUpdateActivity({
      customerId: existing.customerId,
      changes,
      byUserId: req.user!.userId,
      byUserName: editor?.fullName,
      quoteNo: existing.quoteNo,
    });
  }

  // Status degisimi: kim degistirdi olursa olsun musteri zaman cizelgesine
  // dusur ve lastContactDate guncelle (Bekliyor/Kazanildi/Kaybedildi/Iptal arasi gecisler).
  if (changes?.status && changes.status.new !== changes.status.old) {
    try {
      const editor = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { fullName: true },
      });
      await logQuotationStatusChangedActivity({
        customerId: existing.customerId,
        quoteNo: existing.quoteNo,
        oldStatus: String(changes.status.old ?? ''),
        newStatus: String(changes.status.new ?? ''),
        byUserId: req.user!.userId,
        byUserName: editor?.fullName,
      });
    } catch (err) {
      const { logger } = await import('../../config/logger');
      logger.warn({ err: (err as Error).message, quotationId: id }, 'Status activity log basarisiz');
    }
  }

  // Status "Kazanıldı" olduysa auto-create shipment
  if (
    changes?.status &&
    changes.status.new === 'Kazanıldı' &&
    changes.status.old !== 'Kazanıldı'
  ) {
    try {
      const { createShipmentFromQuotation } = await import('../shipments/shipments.service');
      await createShipmentFromQuotation(id, req.user!.userId);
    } catch (err) {
      // Shipment olusturma hatasi teklif guncellemesini engellemesin
      const { logger } = await import('../../config/logger');
      logger.warn({ err: (err as Error).message, quotationId: id }, 'Shipment auto-create basarisiz');
    }
  }

  // Status "Kaybedildi" oldysa, varsa bagli aktif sevkiyat(lar)i otomatik iptal et
  if (
    changes?.status &&
    changes.status.new === 'Kaybedildi' &&
    changes.status.old !== 'Kaybedildi'
  ) {
    try {
      const { cancelShipmentsForLostQuotation } = await import('../shipments/shipments.service');
      await cancelShipmentsForLostQuotation(id, req.user!.userId);
    } catch (err) {
      const { logger } = await import('../../config/logger');
      logger.warn(
        { err: (err as Error).message, quotationId: id },
        'Shipment otomatik iptal basarisiz',
      );
    }
  }

  res.json({ success: true, data: updated });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.quotation.findFirst({ where: { id } });
  if (!existing) {
    throw new AppError('Teklif bulunamadı', 404);
  }

  if (req.user!.role !== 'ADMIN' && existing.assignedUserId !== req.user!.userId) {
    throw new AppError('Bu teklif için yetkiniz yok', 403);
  }

  await prisma.quotation.delete({ where: { id } });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Quotation',
    recordId: id,
    action: 'DELETE',
  });

  res.json({ success: true, message: 'Teklif silindi' });
}

export async function restore(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.quotation.findFirst({
    where: { id, isDeleted: true },
  });
  if (!existing) {
    throw new AppError('Silinmiş teklif bulunamadı', 404);
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: { isDeleted: false },
    include: {
      customer: { select: { id: true, companyName: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Quotation',
    recordId: id,
    action: 'RESTORE',
  });

  res.json({ success: true, data: quotation });
}
