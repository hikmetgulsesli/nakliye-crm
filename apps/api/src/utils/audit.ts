import { prisma } from '../config/database';

export async function createAuditLog(params: {
  userId: number;
  recordType: string;
  recordId: number;
  action: string;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      recordType: params.recordType,
      recordId: params.recordId,
      action: params.action,
      changes: (params.changes || undefined) as any,
    },
  });
}
