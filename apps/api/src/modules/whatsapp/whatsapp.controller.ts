import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { getSetting } from '../../services/system-settings.service';
import {
  sendWhatsApp,
  isTwilioConfigured,
  type InboundWaPayload,
} from '../../services/whatsapp/twilio.service';

export async function sendToCustomer(req: Request, res: Response) {
  const enabled = await getSetting<boolean>('whatsapp.enabled');
  if (enabled === false) throw new AppError('WhatsApp kapali (ayarlardan acin)', 503);
  if (!isTwilioConfigured()) throw new AppError('Twilio yapilandirilmamis', 503);

  const customerId = Number(req.params.customerId);
  const { body } = req.body as { body: string };
  if (!body) throw new AppError('body gerekli', 400);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Müşteri bulunamadı', 404);
  if (!customer.phone) throw new AppError('Müşterinin telefonu yok', 400);

  const result = await sendWhatsApp(customer.phone, body);

  // Activity olarak kaydet
  await prisma.activity.create({
    data: {
      customerId,
      activityType: 'WhatsApp',
      activityDate: new Date(),
      notes: `[WA giden] ${body}`,
      createdById: req.user!.userId,
    },
  });
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastContactDate: new Date() },
  });

  res.json({ success: true, data: result });
}

/**
 * Twilio webhook (gelen WhatsApp mesaji).
 * Twilio console'da URL: https://<prod>/api/whatsapp/inbound
 * Content-Type: application/x-www-form-urlencoded
 */
export async function inbound(req: Request, res: Response) {
  const payload = req.body as InboundWaPayload;
  const from = payload.From?.replace('whatsapp:', '').trim();
  if (!from) {
    return res.status(200).type('text/xml').send('<Response></Response>');
  }

  // E.164 veya benzer format — son 10 hane ile eslestir
  const digits = from.replace(/[^0-9]/g, '');
  const last10 = digits.slice(-10);

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: { contains: last10 } },
        { phone: { contains: digits } },
      ],
      isDeleted: false,
    },
  });

  if (customer) {
    await prisma.activity.create({
      data: {
        customerId: customer.id,
        activityType: 'WhatsApp (gelen)',
        activityDate: new Date(),
        notes: `[WA gelen] ${payload.Body || ''}`,
        createdById: customer.assignedUserId,
      },
    });
    // Gelen mesaj "biz aktif aksiyon aldik" sinyali degil; lastInboundAt'e yaz.
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastInboundAt: new Date() },
    });
  }

  res.status(200).type('text/xml').send('<Response></Response>');
}
