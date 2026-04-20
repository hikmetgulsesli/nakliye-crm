import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Query log gurultusunu kes: sadece PRISMA_QUERY_LOG=true iken aktif.
  log:
    process.env.PRISMA_QUERY_LOG === 'true'
      ? ['query', 'error', 'warn']
      : ['error', 'warn'],
});

// Real-time notification emit middleware — Notification create'ta
// ilgili kullaniciya Socket.IO push
prisma.$use(async (params, next) => {
  const result = await next(params);
  if (params.model === 'Notification' && params.action === 'create' && result) {
    try {
      const { emitToUser } = await import('../realtime/socket');
      const r = result as { userId: number };
      emitToUser(r.userId, 'notification:new', result);
    } catch {
      // socket yoksa sessiz gec
    }
  }
  return result;
});

// Soft delete middleware - automatically filter out deleted records
prisma.$use(async (params, next) => {
  const softDeleteModels = ['Customer', 'Quotation', 'Activity'];

  if (softDeleteModels.includes(params.model || '')) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.isDeleted === undefined) {
        params.args.where.isDeleted = false;
      }
    }

    if (params.action === 'delete') {
      params.action = 'update';
      if (!params.args) params.args = {};
      params.args.data = { isDeleted: true };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args) params.args = {};
      if (!params.args.data) params.args.data = {};
      params.args.data.isDeleted = true;
    }
  }

  return next(params);
});

export { prisma };
