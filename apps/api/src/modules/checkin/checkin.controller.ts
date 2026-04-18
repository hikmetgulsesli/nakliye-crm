import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

/**
 * Saha ziyareti check-in — temsilci GPS konumunda bir müşteri varsa
 * hızlı ziyaret aktivitesi oluşturur.
 */

export async function createCheckin(req: Request, res: Response) {
  const { customerId, lat, lng, notes } = req.body as {
    customerId: number;
    lat: number;
    lng: number;
    notes?: string;
  };
  if (!customerId) throw new AppError('customerId gerekli', 400);
  if (lat == null || lng == null) throw new AppError('Konum (lat+lng) gerekli', 400);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Müşteri bulunamadı', 404);

  const activity = await prisma.activity.create({
    data: {
      customerId,
      activityType: 'Saha Ziyareti',
      activityDate: new Date(),
      notes: `📍 GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}${notes ? '\n' + notes : ''}`,
      outcome: 'Olumlu',
      createdById: req.user!.userId,
    },
  });
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastContactDate: new Date() },
  });
  res.status(201).json({ success: true, data: activity });
}
