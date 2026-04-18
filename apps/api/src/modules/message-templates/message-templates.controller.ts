import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';

export async function list(req: Request, res: Response) {
  const where: Record<string, unknown> = { isActive: true };
  if (req.query.channel) where.channel = String(req.query.channel);
  const rows = await prisma.messageTemplate.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: rows });
}

export async function create(req: Request, res: Response) {
  const { name, channel, subject, body, variables } = req.body as {
    name: string;
    channel: 'whatsapp' | 'sms' | 'email';
    subject?: string;
    body: string;
    variables?: Array<{ key: string; label: string }>;
  };
  if (!name || !channel || !body) throw new AppError('name + channel + body zorunlu', 400);
  const tpl = await prisma.messageTemplate.create({
    data: {
      name,
      channel,
      subject,
      body,
      variables: (variables as unknown as object) || undefined,
      createdById: req.user!.userId,
    },
  });
  res.status(201).json({ success: true, data: tpl });
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const b = req.body as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const allowed = ['name', 'channel', 'subject', 'body', 'variables', 'isActive'];
  for (const k of allowed) if (k in b) data[k] = b[k];
  const tpl = await prisma.messageTemplate.update({ where: { id }, data });
  res.json({ success: true, data: tpl });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.messageTemplate.delete({ where: { id } });
  res.json({ success: true });
}

/**
 * {variable_key} formatlı degiskenleri customer/sender context'ten doldur.
 */
export async function renderForCustomer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const customerId = Number(req.body.customerId);
  const tpl = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!tpl) throw new AppError('Şablon bulunamadı', 404);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { assignedUser: { select: { fullName: true } } },
  });
  if (!customer) throw new AppError('Müşteri bulunamadı', 404);
  const sender = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  const ctx: Record<string, string> = {
    musteri_adi: customer.companyName,
    yetkili_adi: customer.contactName || customer.companyName,
    temsilci_adi: sender?.fullName || '',
    temsilci_email: sender?.email || '',
    tarih: new Date().toLocaleDateString('tr-TR'),
  };

  function interpolate(str: string): string {
    return str.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
  }

  res.json({
    success: true,
    data: {
      subject: tpl.subject ? interpolate(tpl.subject) : null,
      body: interpolate(tpl.body),
      channel: tpl.channel,
    },
  });
}
