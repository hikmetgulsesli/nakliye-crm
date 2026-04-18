import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { getSetting } from '../../services/system-settings.service';

/**
 * Public lead form — web sitesinden yeni muhtemel musteri alir,
 * round-robin ile temsilciye atar.
 */

let roundRobinIdx = 0;

async function pickNextRep(): Promise<number | null> {
  const reps = await prisma.user.findMany({
    where: { isActive: true, role: 'USER' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (reps.length === 0) return null;
  const rep = reps[roundRobinIdx % reps.length];
  roundRobinIdx++;
  return rep.id;
}

export async function submitLead(req: Request, res: Response) {
  // Feature kontrolu public endpoint'te manuel
  const enabled = await getSetting<boolean>('features.lead_forms');
  if (enabled === false) {
    throw new AppError('Lead formu devre dısı', 503);
  }

  const { companyName, contactName, phone, email, notes, origin, destination } = req.body as {
    companyName: string;
    contactName?: string;
    phone?: string;
    email?: string;
    notes?: string;
    origin?: string;
    destination?: string;
  };
  if (!companyName || (!phone && !email)) {
    throw new AppError('companyName + (phone veya email) zorunlu', 400);
  }

  // Dublike önleme
  const dupeConditions: Array<Record<string, unknown>> = [];
  if (email) dupeConditions.push({ email: { equals: email, mode: 'insensitive' } });
  if (phone) dupeConditions.push({ phone });

  const existing = dupeConditions.length
    ? await prisma.customer.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { isDeleted: false, OR: dupeConditions as any },
      })
    : null;
  if (existing) {
    return res.json({
      success: true,
      message: 'Talebiniz alındı. Ekibimiz en kısa sürede dönüş yapacaktır.',
      data: { duplicate: true },
    });
  }

  const assignedUserId = await pickNextRep();
  if (!assignedUserId) throw new AppError('Atama yapılacak temsilci yok', 503);

  const customer = await prisma.customer.create({
    data: {
      companyName,
      contactName: contactName || null,
      phone: phone || '-',
      email: email || '-',
      notes: [notes, origin ? `Çıkış: ${origin}` : null, destination ? `Varış: ${destination}` : null]
        .filter(Boolean)
        .join('\n') || null,
      source: 'Lead Form',
      status: 'Soğuk',
      potential: 'Orta',
      assignedUserId,
      createdById: assignedUserId,
    },
  });

  // Temsilciye bildirim
  await prisma.notification.create({
    data: {
      userId: assignedUserId,
      type: 'success',
      title: '🆕 Yeni Lead',
      message: `${companyName} web formundan geldi — size atandı`,
      link: `/musteriler/${customer.id}`,
    },
  });

  res.json({
    success: true,
    message: 'Talebiniz alındı. Ekibimiz en kısa sürede dönüş yapacaktır.',
    data: { id: customer.id },
  });
}
