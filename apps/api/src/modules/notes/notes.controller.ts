import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

const VALID_OWNER_TYPES = ['customer', 'quotation', 'shipment'];

function extractMentions(content: string): string[] {
  const matches = content.matchAll(/@([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ.]+)/g);
  return Array.from(new Set([...matches].map((m) => m[1])));
}

export async function list(req: Request, res: Response) {
  const { ownerType, ownerId } = req.query as { ownerType?: string; ownerId?: string };
  if (!ownerType || !ownerId) throw new AppError('ownerType + ownerId zorunlu', 400);
  if (!VALID_OWNER_TYPES.includes(ownerType)) throw new AppError('Gecersiz ownerType', 400);

  const notes = await prisma.internalNote.findMany({
    where: { ownerType, ownerId: Number(ownerId) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Include author
  const authorIds = [...new Set(notes.map((n) => n.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  const data = notes.map((n) => ({ ...n, author: authorMap.get(n.authorId) ?? null }));
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response) {
  const { ownerType, ownerId, content } = req.body as {
    ownerType: string;
    ownerId: number;
    content: string;
  };
  if (!content?.trim()) throw new AppError('content zorunlu', 400);
  if (!VALID_OWNER_TYPES.includes(ownerType)) throw new AppError('Gecersiz ownerType', 400);

  // @mention kullanicilarini cozumle
  const mentionNames = extractMentions(content);
  let mentionedUserIds: number[] = [];
  if (mentionNames.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        OR: mentionNames.map((n) => ({
          fullName: { contains: n, mode: 'insensitive' as const },
        })),
      },
      select: { id: true },
    });
    mentionedUserIds = users.map((u) => u.id);
  }

  const note = await prisma.internalNote.create({
    data: {
      ownerType,
      ownerId,
      authorId: req.user!.userId,
      content,
      mentionedUserIds,
    },
  });

  // Bildirim olustur
  if (mentionedUserIds.length > 0) {
    const author = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    await prisma.notification.createMany({
      data: mentionedUserIds
        .filter((uid) => uid !== req.user!.userId)
        .map((uid) => ({
          userId: uid,
          type: 'info',
          title: 'Notta etiketlendiniz',
          message: `${author?.fullName} sizi bir notta etiketledi: ${content.slice(0, 80)}`,
          link: `/${ownerType === 'customer' ? 'musteriler' : ownerType === 'quotation' ? 'teklifler' : 'sevkiyatlar'}/${ownerId}`,
        })),
    });
  }

  res.status(201).json({ success: true, data: note });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  const note = await prisma.internalNote.findUnique({ where: { id } });
  if (!note) throw new AppError('Not bulunamadi', 404);
  if (note.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Bu notu silme yetkiniz yok', 403);
  }
  await prisma.internalNote.delete({ where: { id } });
  res.json({ success: true });
}
