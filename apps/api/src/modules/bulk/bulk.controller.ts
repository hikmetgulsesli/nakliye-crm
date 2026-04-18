import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';

/**
 * Toplu islem endpoint'leri. ids + action + payload ile.
 */

export async function bulkCustomers(req: Request, res: Response) {
  const { ids, action, payload } = req.body as {
    ids: number[];
    action: 'assign' | 'setStatus' | 'delete' | 'restore';
    payload?: Record<string, unknown>;
  };
  if (!Array.isArray(ids) || ids.length === 0) throw new AppError('ids gerekli', 400);

  let count = 0;
  switch (action) {
    case 'assign':
      if (!payload?.assignedUserId) throw new AppError('payload.assignedUserId gerekli', 400);
      count = (
        await prisma.customer.updateMany({
          where: { id: { in: ids }, isDeleted: false },
          data: { assignedUserId: Number(payload.assignedUserId) },
        })
      ).count;
      break;
    case 'setStatus':
      if (!payload?.status) throw new AppError('payload.status gerekli', 400);
      count = (
        await prisma.customer.updateMany({
          where: { id: { in: ids }, isDeleted: false },
          data: { status: String(payload.status) },
        })
      ).count;
      break;
    case 'delete':
      if (req.user!.role !== 'ADMIN') throw new AppError('Sadece admin silebilir', 403);
      count = (
        await prisma.customer.updateMany({
          where: { id: { in: ids } },
          data: { isDeleted: true },
        })
      ).count;
      break;
    case 'restore':
      if (req.user!.role !== 'ADMIN') throw new AppError('Sadece admin geri alabilir', 403);
      count = (
        await prisma.customer.updateMany({
          where: { id: { in: ids } },
          data: { isDeleted: false },
        })
      ).count;
      break;
    default:
      throw new AppError('Gecersiz aksiyon', 400);
  }

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Customer',
    recordId: 0,
    action: 'BULK_' + action.toUpperCase(),
    changes: { bulk: { old: null, new: { ids, payload } } },
  });

  res.json({ success: true, data: { affected: count } });
}

export async function bulkQuotations(req: Request, res: Response) {
  const { ids, action, payload } = req.body as {
    ids: number[];
    action: 'assign' | 'setStatus' | 'delete';
    payload?: Record<string, unknown>;
  };
  if (!Array.isArray(ids) || ids.length === 0) throw new AppError('ids gerekli', 400);

  let count = 0;
  switch (action) {
    case 'assign':
      if (!payload?.assignedUserId) throw new AppError('payload.assignedUserId gerekli', 400);
      count = (
        await prisma.quotation.updateMany({
          where: { id: { in: ids }, isDeleted: false },
          data: { assignedUserId: Number(payload.assignedUserId) },
        })
      ).count;
      break;
    case 'setStatus':
      if (!payload?.status) throw new AppError('payload.status gerekli', 400);
      count = (
        await prisma.quotation.updateMany({
          where: { id: { in: ids }, isDeleted: false },
          data: { status: String(payload.status) },
        })
      ).count;
      break;
    case 'delete':
      if (req.user!.role !== 'ADMIN') throw new AppError('Sadece admin silebilir', 403);
      count = (
        await prisma.quotation.updateMany({
          where: { id: { in: ids } },
          data: { isDeleted: true },
        })
      ).count;
      break;
    default:
      throw new AppError('Gecersiz aksiyon', 400);
  }

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Quotation',
    recordId: 0,
    action: 'BULK_' + action.toUpperCase(),
    changes: { bulk: { old: null, new: { ids, payload } } },
  });

  res.json({ success: true, data: { affected: count } });
}
