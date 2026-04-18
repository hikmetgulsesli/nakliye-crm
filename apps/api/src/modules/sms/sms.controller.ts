import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { getSetting } from '../../services/system-settings.service';
import { sendSMS, isNetgsmConfigured } from '../../services/sms/netgsm.service';

export async function sendToCustomer(req: Request, res: Response) {
  const enabled = await getSetting<boolean>('sms.enabled');
  if (enabled === false) throw new AppError('SMS kapali (ayarlardan acin)', 503);
  if (!isNetgsmConfigured()) throw new AppError('Netgsm yapilandirilmamis', 503);

  const customerId = Number(req.params.customerId);
  const { message } = req.body as { message: string };
  if (!message) throw new AppError('message gerekli', 400);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Müşteri bulunamadı', 404);
  if (!customer.phone) throw new AppError('Müşterinin telefonu yok', 400);

  const result = await sendSMS(customer.phone, message);

  await prisma.activity.create({
    data: {
      customerId,
      activityType: 'SMS',
      activityDate: new Date(),
      notes: `[SMS giden] ${message}`,
      createdById: req.user!.userId,
    },
  });

  res.json({ success: true, data: result });
}
