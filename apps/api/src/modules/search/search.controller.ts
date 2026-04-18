import { Request, Response } from 'express';
import { prisma } from '../../config/database';

/**
 * Global arama — musteri, teklif, sevkiyat, aktivite icinde fulltext.
 * Basit ILIKE tabanli; ileride pg_trgm GIN index eklenebilir.
 */
export async function search(req: Request, res: Response) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return res.json({
      success: true,
      data: { customers: [], quotations: [], shipments: [], activities: [] },
    });
  }

  const [customers, quotations, shipments, activities] = await Promise.all([
    prisma.customer.findMany({
      where: {
        isDeleted: false,
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, companyName: true, contactName: true, phone: true, status: true },
      take: 5,
    }),
    prisma.quotation.findMany({
      where: {
        isDeleted: false,
        OR: [
          { quoteNo: { contains: q, mode: 'insensitive' } },
          { customer: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { companyName: true } } },
      take: 5,
    }),
    prisma.shipment.findMany({
      where: {
        isDeleted: false,
        OR: [
          { shipmentNo: { contains: q, mode: 'insensitive' } },
          { blNumber: { contains: q, mode: 'insensitive' } },
          { awbNumber: { contains: q, mode: 'insensitive' } },
          { customer: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { companyName: true } } },
      take: 5,
    }),
    prisma.activity.findMany({
      where: {
        isDeleted: false,
        OR: [
          { notes: { contains: q, mode: 'insensitive' } },
          { customer: { companyName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { activityDate: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: { customers, quotations, shipments, activities },
  });
}
