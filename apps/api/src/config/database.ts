import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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
