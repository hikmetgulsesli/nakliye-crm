import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

/**
 * Müşteri zaman çizelgesi — activity + quotation (create/update/win/loss) +
 * revision + shipment event + audit + internal note, chronological.
 */
export async function customerTimeline(req: Request, res: Response) {
  const customerId = Number(req.params.customerId);
  if (!customerId) throw new AppError('customerId gerekli', 400);

  const [activities, quotations, revisions, shipments, shipmentEvents, audits, notes] =
    await Promise.all([
      prisma.activity.findMany({
        where: { customerId, isDeleted: false },
        include: { createdBy: { select: { id: true, fullName: true } } },
      }),
      prisma.quotation.findMany({
        where: { customerId, isDeleted: false },
        include: { createdBy: { select: { id: true, fullName: true } } },
      }),
      prisma.quotationRevision.findMany({
        where: { quotation: { customerId, isDeleted: false } },
        include: {
          revisedBy: { select: { id: true, fullName: true } },
          quotation: { select: { id: true, quoteNo: true } },
        },
      }),
      prisma.shipment.findMany({
        where: { customerId, isDeleted: false },
      }),
      prisma.shipmentEvent.findMany({
        where: { shipment: { customerId, isDeleted: false } },
        include: { shipment: { select: { id: true, shipmentNo: true } } },
      }),
      prisma.auditLog.findMany({
        where: {
          recordType: 'Customer',
          recordId: customerId,
        },
        include: { user: { select: { id: true, fullName: true } } },
      }),
      prisma.internalNote.findMany({
        where: { ownerType: 'customer', ownerId: customerId },
      }),
    ]);

  // Author'lari coz
  const authorIds = new Set(notes.map((n) => n.authorId));
  const authors = await prisma.user.findMany({
    where: { id: { in: Array.from(authorIds) } },
    select: { id: true, fullName: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  interface Event {
    id: string;
    type: 'activity' | 'quotation' | 'revision' | 'shipment' | 'shipment_event' | 'audit' | 'note';
    icon: string;
    at: Date;
    actor: string | null;
    title: string;
    detail?: string;
    link?: string;
  }

  const events: Event[] = [];

  for (const a of activities) {
    events.push({
      id: `act-${a.id}`,
      type: 'activity',
      icon: 'event_note',
      at: a.activityDate,
      actor: a.createdBy?.fullName || null,
      title: `${a.activityType || 'Aktivite'}${a.outcome ? ' — ' + a.outcome : ''}`,
      detail: a.notes || undefined,
    });
  }
  for (const q of quotations) {
    events.push({
      id: `q-${q.id}`,
      type: 'quotation',
      icon: 'request_quote',
      at: q.createdAt,
      actor: q.createdBy?.fullName || null,
      title: `Teklif ${q.quoteNo} — ${q.status}`,
      detail: q.price ? `${q.price} ${q.currency || ''}` : undefined,
      link: `/teklifler/${q.id}`,
    });
  }
  for (const r of revisions) {
    events.push({
      id: `rev-${r.id}`,
      type: 'revision',
      icon: 'edit_note',
      at: r.revisedAt,
      actor: r.revisedBy?.fullName || null,
      title: `Revize #${r.revisionNo} — ${r.quotation.quoteNo}`,
      link: `/teklifler/${r.quotation.id}`,
    });
  }
  for (const s of shipments) {
    events.push({
      id: `ship-${s.id}`,
      type: 'shipment',
      icon: 'local_shipping',
      at: s.createdAt,
      actor: null,
      title: `Sevkiyat ${s.shipmentNo}`,
      detail: `${s.originCountry || '?'} → ${s.destinationCountry || '?'}`,
      link: `/sevkiyatlar/${s.id}`,
    });
  }
  for (const ev of shipmentEvents) {
    events.push({
      id: `shipev-${ev.id}`,
      type: 'shipment_event',
      icon: 'route',
      at: ev.occurredAt,
      actor: null,
      title: `${ev.shipment.shipmentNo} — ${ev.toStatus || ev.eventType}`,
      detail: ev.note || ev.location || undefined,
      link: `/sevkiyatlar/${ev.shipment.id}`,
    });
  }
  for (const al of audits) {
    events.push({
      id: `aud-${al.id}`,
      type: 'audit',
      icon: 'history',
      at: al.createdAt,
      actor: al.user?.fullName || null,
      title: `${al.action}`,
    });
  }
  for (const n of notes) {
    const author = authorMap.get(n.authorId);
    events.push({
      id: `note-${n.id}`,
      type: 'note',
      icon: 'sticky_note_2',
      at: n.createdAt,
      actor: author?.fullName || null,
      title: 'İç Not',
      detail: n.content,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  res.json({ success: true, data: events });
}
