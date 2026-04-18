import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import {
  presignUpload,
  presignDownload,
  deleteObject,
  buildKey,
  isStorageConfigured,
} from '../../services/storage.service';

const VALID_OWNER_TYPES = ['customer', 'quotation', 'shipment'] as const;
const VALID_CATEGORIES = ['bl', 'invoice', 'cmr', 'contract', 'proforma', 'other'] as const;

function validateOwnerType(t: string): t is (typeof VALID_OWNER_TYPES)[number] {
  return (VALID_OWNER_TYPES as readonly string[]).includes(t);
}

function validateCategory(c: string): boolean {
  return (VALID_CATEGORIES as readonly string[]).includes(c);
}

/**
 * Adim 1: Presigned upload URL iste.
 * Frontend dogrudan R2/S3'e PUT atacak.
 */
export async function requestUpload(req: Request, res: Response) {
  if (!isStorageConfigured()) {
    throw new AppError('Object storage yapilandirilmamis (S3_ENDPOINT vb. env eksik)', 503);
  }

  const { ownerType, ownerId, filename, contentType, category } = req.body as {
    ownerType: string;
    ownerId: number;
    filename: string;
    contentType: string;
    category: string;
  };

  if (!validateOwnerType(ownerType)) throw new AppError('Gecersiz ownerType', 400);
  if (!validateCategory(category)) throw new AppError('Gecersiz kategori', 400);
  if (!filename || !contentType) throw new AppError('filename + contentType zorunlu', 400);

  const key = buildKey({ ownerType, ownerId, originalName: filename });
  const { url, method } = await presignUpload({ key, contentType });
  res.json({
    success: true,
    data: { key, uploadUrl: url, method },
  });
}

/**
 * Adim 2: Upload bitti, metadata DB'ye kaydet.
 */
export async function confirmUpload(req: Request, res: Response) {
  const { ownerType, ownerId, category, filename, storageKey, contentType, sizeBytes } = req.body as {
    ownerType: string;
    ownerId: number;
    category: string;
    filename: string;
    storageKey: string;
    contentType?: string;
    sizeBytes: number;
  };

  if (!validateOwnerType(ownerType)) throw new AppError('Gecersiz ownerType', 400);
  if (!validateCategory(category)) throw new AppError('Gecersiz kategori', 400);

  // Version: ayni ownerType/ownerId/filename varsa +1
  const prev = await prisma.document.findFirst({
    where: { ownerType, ownerId, filename },
    orderBy: { version: 'desc' },
  });

  const doc = await prisma.document.create({
    data: {
      ownerType,
      ownerId,
      category,
      filename,
      storageKey,
      contentType,
      sizeBytes,
      version: prev ? prev.version + 1 : 1,
      uploadedById: req.user!.userId,
    },
  });
  res.status(201).json({ success: true, data: doc });
}

export async function list(req: Request, res: Response) {
  const { ownerType, ownerId } = req.query as { ownerType?: string; ownerId?: string };
  if (!ownerType || !ownerId) throw new AppError('ownerType + ownerId zorunlu', 400);
  if (!validateOwnerType(ownerType)) throw new AppError('Gecersiz ownerType', 400);

  const docs = await prisma.document.findMany({
    where: { ownerType, ownerId: Number(ownerId) },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: docs });
}

export async function downloadUrl(req: Request, res: Response) {
  const id = Number(req.params.id);
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AppError('Doküman bulunamadı', 404);

  const url = await presignDownload({ key: doc.storageKey, filename: doc.filename });
  res.json({ success: true, data: { url, filename: doc.filename } });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new AppError('Doküman bulunamadı', 404);

  // Sadece yukleyen veya admin silebilir
  if (doc.uploadedById !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Bu dosyayi silmeye yetkiniz yok', 403);
  }

  try {
    await deleteObject(doc.storageKey);
  } catch {
    // Storage silme basarisiz olursa bile DB kaydini sil (admin yine de erisebilir)
  }
  await prisma.document.delete({ where: { id } });
  res.json({ success: true });
}
