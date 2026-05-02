import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

const VALID_OWNER_TYPES = ['customer', 'quotation', 'shipment'];

// "@Ahmet Yilmaz" gibi cok kelimeli isimleri de yakalar; en fazla 3 kelimeli ad-soyad.
// Turkce karakterler dahil; nokta ad kisaltmalari icin (Ahmet Y.).
const MENTION_REGEX = /@([A-Za-zÇĞİıÖŞÜçğıöşü.]+(?:\s+[A-Za-zÇĞİıÖŞÜçğıöşü.]+){0,2})/g;

function extractMentionTokens(content: string): string[] {
  const matches = content.matchAll(MENTION_REGEX);
  return Array.from(new Set([...matches].map((m) => m[1].trim())));
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
  const {
    ownerType,
    ownerId,
    content,
    mentionedUserIds: bodyMentionIds,
  } = req.body as {
    ownerType: string;
    ownerId: number;
    content: string;
    mentionedUserIds?: number[];
  };
  if (!content?.trim()) throw new AppError('content zorunlu', 400);
  if (!VALID_OWNER_TYPES.includes(ownerType)) throw new AppError('Gecersiz ownerType', 400);

  // Frontend autocomplete'ten gelen ID'ler birincil kaynaktir; metinden regex parse
  // fallback olarak (eski client veya elle yazilan ad icin) calisir.
  const explicitIds = Array.isArray(bodyMentionIds)
    ? bodyMentionIds.filter((n) => Number.isInteger(n) && n > 0)
    : [];

  let resolvedFromText: number[] = [];
  const tokens = extractMentionTokens(content);
  if (tokens.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        OR: tokens.map((n) => ({
          fullName: { contains: n, mode: 'insensitive' as const },
        })),
      },
      select: { id: true },
    });
    resolvedFromText = users.map((u) => u.id);
  }

  const mentionedUserIds = Array.from(new Set([...explicitIds, ...resolvedFromText]));

  const note = await prisma.internalNote.create({
    data: {
      ownerType,
      ownerId,
      authorId: req.user!.userId,
      content,
      mentionedUserIds,
    },
  });

  // Bildirim olustur — kendine etiket yapanlar atilir.
  // createMany Prisma middleware'i tetiklemedigi icin tek tek create ediyoruz;
  // boylece database.ts'deki Notification create middleware'i Socket.IO emit yapar.
  const targets = mentionedUserIds.filter((uid) => uid !== req.user!.userId);
  if (targets.length > 0) {
    const author = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });
    const link = `/${ownerType === 'customer' ? 'musteriler' : ownerType === 'quotation' ? 'teklifler' : 'sevkiyatlar'}/${ownerId}#internal-notes`;
    const message = `${author?.fullName ?? 'Bir kullanici'} sizi bir notta etiketledi: ${content.slice(0, 80)}`;
    await Promise.all(
      targets.map((uid) =>
        prisma.notification.create({
          data: {
            userId: uid,
            type: 'info',
            title: 'Notta etiketlendiniz',
            message,
            link,
          },
        }),
      ),
    );
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
