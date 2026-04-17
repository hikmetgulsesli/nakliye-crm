import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { createAuditLog } from '../../utils/audit';

export async function preview(req: Request, res: Response) {
  const sourceUserId = req.body.sourceUserId ?? req.body.fromUserId;
  const targetUserId = req.body.targetUserId ?? req.body.toUserId;

  if (!sourceUserId || !targetUserId) {
    throw new AppError('Kaynak ve hedef kullanıcı ID gerekli', 400);
  }

  if (sourceUserId === targetUserId) {
    throw new AppError('Kaynak ve hedef kullanıcı ayni olamaz', 400);
  }

  const [sourceUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: sourceUserId }, select: { id: true, fullName: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, fullName: true } }),
  ]);

  if (!sourceUser) throw new AppError('Kaynak kullanıcı bulunamadı', 404);
  if (!targetUser) throw new AppError('Hedef kullanıcı bulunamadı', 404);

  const [customerCount, quotationCount, activityCount] = await Promise.all([
    prisma.customer.count({ where: { assignedUserId: sourceUserId, isDeleted: false } }),
    prisma.quotation.count({ where: { assignedUserId: sourceUserId, isDeleted: false } }),
    prisma.activity.count({ where: { createdById: sourceUserId, isDeleted: false } }),
  ]);

  res.json({
    success: true,
    data: {
      sourceUser,
      targetUser,
      affectedRecords: {
        customers: customerCount,
        quotations: quotationCount,
        activities: activityCount,
        total: customerCount + quotationCount + activityCount,
      },
    },
  });
}

export async function execute(req: Request, res: Response) {
  const sourceUserId = req.body.sourceUserId ?? req.body.fromUserId;
  const targetUserId = req.body.targetUserId ?? req.body.toUserId;

  if (!sourceUserId || !targetUserId) {
    throw new AppError('Kaynak ve hedef kullanıcı ID gerekli', 400);
  }

  if (sourceUserId === targetUserId) {
    throw new AppError('Kaynak ve hedef kullanıcı ayni olamaz', 400);
  }

  const [sourceUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: sourceUserId }, select: { id: true, fullName: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, fullName: true } }),
  ]);

  if (!sourceUser) throw new AppError('Kaynak kullanıcı bulunamadı', 404);
  if (!targetUser) throw new AppError('Hedef kullanıcı bulunamadı', 404);

  // Execute transfer in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const customersUpdated = await tx.customer.updateMany({
      where: { assignedUserId: sourceUserId, isDeleted: false },
      data: { assignedUserId: targetUserId },
    });

    const quotationsUpdated = await tx.quotation.updateMany({
      where: { assignedUserId: sourceUserId, isDeleted: false },
      data: { assignedUserId: targetUserId },
    });

    const activitiesUpdated = await tx.activity.updateMany({
      where: { createdById: sourceUserId, isDeleted: false },
      data: { createdById: targetUserId },
    });

    return {
      customers: customersUpdated.count,
      quotations: quotationsUpdated.count,
      activities: activitiesUpdated.count,
    };
  });

  // Create audit log
  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'Transfer',
    recordId: sourceUserId,
    action: 'TRANSFER',
    changes: {
      sourceUser: { old: sourceUser.fullName, new: null },
      targetUser: { old: null, new: targetUser.fullName },
      transferredCustomers: { old: 0, new: result.customers },
      transferredQuotations: { old: 0, new: result.quotations },
      transferredActivities: { old: 0, new: result.activities },
    },
  });

  res.json({
    success: true,
    data: {
      sourceUser,
      targetUser,
      transferred: result,
    },
    message: `${result.customers + result.quotations + result.activities} kayıt basariyla devredildi`,
  });
}
