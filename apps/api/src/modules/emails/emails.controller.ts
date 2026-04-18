import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { queueEmail, sendEmailNow } from '../../services/email';
import {
  testEmailTemplate,
  dailyDigestTemplate,
  quotationEmailTemplate,
} from '../../services/email/templates';
import { AppError } from '../../middleware/error-handler';

export async function sendTest(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

  const baseUrl = process.env.APP_BASE_URL || 'https://nakliye.setrox.com.tr';
  const tpl = testEmailTemplate({
    recipientName: user.fullName,
    triggeredBy: user.email,
    baseUrl,
  });

  const result = await sendEmailNow({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
  });

  res.json({ success: true, data: result, message: 'Test e-postası gönderildi' });
}

/**
 * Admin triggered daily digest (normalde cron tetikler).
 * Mevcut kullanicilarin hepsi icin kuyruga atar.
 */
export async function sendDailyDigest(req: Request, res: Response) {
  const baseUrl = process.env.APP_BASE_URL || 'https://nakliye.setrox.com.tr';
  const today = new Date().toLocaleDateString('tr-TR');

  const users = await prisma.user.findMany({
    where: { isActive: true, role: 'ADMIN' },
    select: { id: true, email: true, fullName: true },
  });

  const queued: number[] = [];
  for (const user of users) {
    // Admin icin tum kullanicilarin ozetinin toplami
    const [uncontacted, pending, expired] = await Promise.all([
      prisma.notification.count({
        where: {
          title: 'Aranmayan Müşteri',
          createdAt: { gte: twentyFourHoursAgo() },
        },
      }),
      prisma.notification.count({
        where: {
          title: 'Bekleyen Teklif',
          createdAt: { gte: twentyFourHoursAgo() },
        },
      }),
      prisma.notification.count({
        where: {
          title: 'Süresi Dolmus Teklif',
          createdAt: { gte: twentyFourHoursAgo() },
        },
      }),
    ]);

    if (uncontacted + pending + expired === 0) continue;

    const tpl = dailyDigestTemplate({
      recipientName: user.fullName,
      date: today,
      uncontactedCount: uncontacted,
      pendingQuoteCount: pending,
      expiredQuoteCount: expired,
      baseUrl,
    });

    const jobId = await queueEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
    });
    if (jobId) queued.push(user.id);
  }

  res.json({
    success: true,
    data: { queued: queued.length, recipients: queued },
    message: `${queued.length} kullanıcı için günlük özet kuyruğa eklendi`,
  });
}

/**
 * Bir teklif için müşteriye e-posta gönderir (AI taslağı sonrası).
 */
export async function sendQuotationEmail(req: Request, res: Response) {
  const quotationId = Number(req.params.quotationId);
  const { messageBody, recipientEmail, cc } = req.body as {
    messageBody: string;
    recipientEmail?: string;
    cc?: string[];
  };

  if (!messageBody) throw new AppError('messageBody zorunlu', 400);

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: { select: { companyName: true, email: true, contactName: true } },
    },
  });
  if (!quotation) throw new AppError('Teklif bulunamadı', 404);

  const sender = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!sender) throw new AppError('Gönderen bulunamadı', 404);

  const tpl = quotationEmailTemplate({
    customerName: quotation.customer.contactName || quotation.customer.companyName,
    companyName: quotation.customer.companyName,
    quoteNo: quotation.quoteNo,
    messageBody,
    senderName: sender.fullName,
    senderEmail: sender.email,
  });

  const result = await sendEmailNow({
    to: recipientEmail || quotation.customer.email,
    subject: tpl.subject,
    html: tpl.html,
    cc,
    replyTo: sender.email,
  });

  res.json({
    success: true,
    data: result,
    message: `E-posta ${recipientEmail || quotation.customer.email} adresine gönderildi`,
  });
}

function twentyFourHoursAgo(): Date {
  const d = new Date();
  d.setHours(d.getHours() - 24);
  return d;
}
