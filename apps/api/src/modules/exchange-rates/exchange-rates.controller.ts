import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { fetchTcmbRates, convertToTRY } from '../../services/exchange-rates/tcmb.service';

export async function latest(_req: Request, res: Response) {
  const codes = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY'];
  const rates: Record<string, { buying: number; selling: number; date: string } | null> = {};
  for (const code of codes) {
    const r = await prisma.exchangeRate.findFirst({
      where: { currency: code },
      orderBy: { date: 'desc' },
    });
    rates[code] = r
      ? {
          buying: r.buying,
          selling: r.selling,
          date: r.date.toISOString().split('T')[0],
        }
      : null;
  }
  res.json({ success: true, data: rates });
}

export async function history(req: Request, res: Response) {
  const code = (req.query.currency as string) || 'USD';
  const days = Math.min(180, Number(req.query.days ?? 30));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rates = await prisma.exchangeRate.findMany({
    where: { currency: code, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
  res.json({ success: true, data: rates });
}

export async function convert(req: Request, res: Response) {
  const amount = Number(req.query.amount);
  const currency = String(req.query.currency || 'USD');
  if (!isFinite(amount)) return res.status(400).json({ success: false, message: 'amount gerekli' });
  const result = await convertToTRY(amount, currency);
  res.json({ success: true, data: result });
}

export async function refresh(_req: Request, res: Response) {
  const result = await fetchTcmbRates();
  res.json({ success: true, data: result });
}
