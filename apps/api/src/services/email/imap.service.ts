import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { getSetting } from '../system-settings.service';

/**
 * IMAP istemci: satis ekibi mailboxundan gelen mailleri cek, from/to'daki
 * email'e sahip musterilere Activity olarak bagla.
 *
 * Env:
 *   IMAP_HOST, IMAP_PORT (993), IMAP_USER, IMAP_PASSWORD,
 *   IMAP_SECURE (true default)
 *
 * Dikkat: production'da bu ayarlari SystemSettings UI'dan da okuyoruz
 * (imap.enabled toggle).
 */

function isConfigured(): boolean {
  return Boolean(
    process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD,
  );
}

async function extractEmails(parsed: ParsedMail): Promise<string[]> {
  const emails = new Set<string>();
  const addObjs = [parsed.from, parsed.to, parsed.cc, parsed.bcc].flat().filter(Boolean);
  for (const a of addObjs) {
    const obj = a as { value?: Array<{ address?: string }> };
    for (const v of obj?.value || []) {
      if (v.address) emails.add(v.address.toLowerCase());
    }
  }
  return Array.from(emails);
}

export async function syncImapOnce(): Promise<{ scanned: number; linked: number }> {
  const enabled = await getSetting<boolean>('imap.enabled');
  if (enabled === false) {
    logger.debug('imap.enabled=false, atlandi');
    return { scanned: 0, linked: 0 };
  }
  if (!isConfigured()) {
    logger.warn('IMAP yapilandirilmadi (IMAP_HOST, IMAP_USER, IMAP_PASSWORD eksik)');
    return { scanned: 0, linked: 0 };
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: process.env.IMAP_USER!,
      pass: process.env.IMAP_PASSWORD!,
    },
    logger: false,
  });

  let scanned = 0;
  let linked = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Son 1 gunluk mailleri tara
      const since = new Date();
      since.setDate(since.getDate() - 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const msg of client.fetch({ since }, { envelope: true, source: true, uid: true }) as any) {
        scanned++;
        const parsed = await simpleParser(msg.source);
        const emails = await extractEmails(parsed);
        if (emails.length === 0) continue;

        // Email eslesen musterileri bul
        const customers = await prisma.customer.findMany({
          where: {
            email: { in: emails, mode: 'insensitive' },
            isDeleted: false,
          },
          select: { id: true, assignedUserId: true },
        });

        for (const c of customers) {
          // Idempotency: ayni UID + musteri zaten kayitlandiysa atlama
          const key = `imap-uid-${msg.uid}-cust-${c.id}`;
          const existing = await prisma.activity.findFirst({
            where: {
              customerId: c.id,
              activityType: 'E-posta',
              notes: { contains: key },
            },
          });
          if (existing) continue;

          await prisma.activity.create({
            data: {
              customerId: c.id,
              activityType: 'E-posta (gelen)',
              activityDate: parsed.date || new Date(),
              notes: `${parsed.subject || '(Konusuz)'}\n\n${parsed.text?.slice(0, 500) || ''}\n\n[${key}]`,
              outcome: null,
              createdById: c.assignedUserId,
            },
          });
          // Gelen mail "biz aktif aksiyon aldik" sinyali degil; lastInboundAt'e yaz.
          await prisma.customer.update({
            where: { id: c.id },
            data: { lastInboundAt: parsed.date || new Date() },
          });
          linked++;
        }
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'IMAP sync hatasi');
  } finally {
    await client.logout().catch(() => {});
  }

  logger.info({ scanned, linked }, 'IMAP sync tamamlandi');
  return { scanned, linked };
}
