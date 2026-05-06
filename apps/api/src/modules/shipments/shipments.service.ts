import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export async function generateShipmentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SHP-${year}-`;
  const last = await prisma.shipment.findFirst({
    where: { shipmentNo: { startsWith: prefix } },
    orderBy: { shipmentNo: 'desc' },
  });
  let nextNum = 1;
  if (last) {
    const n = parseInt(last.shipmentNo.replace(prefix, ''), 10);
    nextNum = n + 1;
  }
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Teklif "Kazanildi" statusune gectiginde cagirilir. Idempotent —
 * ayni teklif icin shipment varsa tekrar olusturmaz.
 */
export async function createShipmentFromQuotation(quotationId: number, userId: number) {
  const existing = await prisma.shipment.findFirst({
    where: { quotationId, isDeleted: false },
  });
  if (existing) {
    logger.info({ quotationId, shipmentId: existing.id }, 'Shipment zaten mevcut, atlandi');
    return existing;
  }

  const q = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!q) throw new Error('Teklif bulunamadı');

  const shipmentNo = await generateShipmentNumber();
  const shipment = await prisma.shipment.create({
    data: {
      shipmentNo,
      quotationId: q.id,
      customerId: q.customerId,
      transportMode: q.transportMode,
      serviceType: q.serviceType,
      originCountry: q.originCountry,
      pol: q.pol,
      destinationCountry: q.destinationCountry,
      pod: q.pod,
      status: 'booked',
      assignedUserId: q.assignedUserId,
      createdById: userId,
    },
  });

  await prisma.shipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      eventType: 'status_change',
      toStatus: 'booked',
      note: `Teklif ${q.quoteNo} kazanildi, sevkiyat olusturuldu`,
      occurredAt: new Date(),
      createdById: userId,
    },
  });

  logger.info({ shipmentId: shipment.id, quotationId: q.id }, 'Shipment olusturuldu');
  return shipment;
}

/**
 * Teklif "Kaybedildi"ye gectiginde, varsa o teklife bagli sevkiyat(lar)i
 * iptal eder. Idempotent — zaten 'cancelled' veya 'delivered' olanlara
 * dokunmaz; final olmayanlari 'cancelled' yapip event log'a kaydeder.
 *
 * Birden fazla sevkiyat olabilir (revize teklif vs.) — hepsini tarar.
 */
export async function cancelShipmentsForLostQuotation(
  quotationId: number,
  userId: number,
): Promise<{ cancelledCount: number }> {
  const shipments = await prisma.shipment.findMany({
    where: {
      quotationId,
      isDeleted: false,
      status: { notIn: ['cancelled', 'delivered'] },
    },
  });

  if (shipments.length === 0) {
    logger.info({ quotationId }, 'Iptal edilecek aktif sevkiyat yok');
    return { cancelledCount: 0 };
  }

  let cancelled = 0;
  for (const s of shipments) {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: s.id },
        data: { status: 'cancelled' },
      });
      await tx.shipmentEvent.create({
        data: {
          shipmentId: s.id,
          eventType: 'status_change',
          fromStatus: s.status,
          toStatus: 'cancelled',
          note: 'Bağlı teklif "Kaybedildi" olarak işaretlendi — sevkiyat otomatik iptal edildi.',
          occurredAt: new Date(),
          createdById: userId,
        },
      });
    });
    cancelled++;
    logger.info(
      { shipmentId: s.id, quotationId, fromStatus: s.status },
      'Shipment otomatik iptal edildi (kaybedildi teklif)',
    );
  }

  return { cancelledCount: cancelled };
}
