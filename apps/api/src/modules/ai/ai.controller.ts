import { Request, Response } from 'express';
import { aiChat, resolveProvider } from '../../services/ai';
import { draftQuoteEmail } from '../../services/ai/tasks/draft-email';
import { calculateWinProbability } from '../../services/ai/tasks/win-probability';
import { computeChurnRisk, runChurnRiskBatch } from '../../services/ai/tasks/churn-risk';
import { generateCoachingInsights } from '../../services/ai/tasks/coaching';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import type { AIMessage, AITaskName } from '@nakliye-crm/shared';

/**
 * Genel amacli AI chat endpoint'i — frontend'den ornek/test icin.
 * Gorev-spesifik endpoint'ler (draft-email, win-probability vb.)
 * sonraki fazlarda modullere eklenir.
 */
export async function chat(req: Request, res: Response) {
  const { messages, model, temperature, maxTokens, task } = req.body as {
    messages: AIMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    task?: AITaskName;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'messages gerekli' });
  }

  const result = await aiChat(messages, {
    model,
    temperature,
    maxTokens,
    task,
    userId: req.user?.userId,
  });
  res.json({ success: true, data: result });
}

export async function draftQuoteEmailHandler(req: Request, res: Response) {
  const quotationId = Number(req.params.quotationId);
  const { language = 'tr', tone = 'formal', extraInstructions } = req.body as {
    language?: 'tr' | 'en';
    tone?: 'formal' | 'friendly' | 'concise';
    extraInstructions?: string;
  };

  const q = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: { select: { companyName: true, contactName: true } },
    },
  });
  if (!q) throw new AppError('Teklif bulunamadı', 404);

  const sender = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!sender) throw new AppError('Gönderen bulunamadı', 404);

  const text = await draftQuoteEmail({
    language,
    tone,
    customerName: q.customer.contactName || q.customer.companyName,
    companyName: q.customer.companyName,
    quoteNo: q.quoteNo,
    quoteDate: q.quoteDate.toISOString().split('T')[0],
    validityDate: q.validityDate ? q.validityDate.toISOString().split('T')[0] : '-',
    transportMode: q.transportMode || undefined,
    serviceType: q.serviceType || undefined,
    originCountry: q.originCountry || undefined,
    pol: q.pol || undefined,
    destinationCountry: q.destinationCountry || undefined,
    pod: q.pod || undefined,
    incoterm: q.incoterm || undefined,
    price: Number(q.price),
    currency: q.currency || 'USD',
    priceNote: q.priceNote || undefined,
    senderName: sender.fullName,
    extraInstructions,
    userId: sender.id,
  });

  res.json({ success: true, data: { draft: text } });
}

export async function winProbability(req: Request, res: Response) {
  const quotationId = Number(req.params.quotationId);
  const result = await calculateWinProbability(quotationId);
  res.json({ success: true, data: result });
}

export async function churnRiskList(req: Request, res: Response) {
  const level = req.query.level as string | undefined;
  const limit = Math.min(100, Number(req.query.limit ?? 20));
  const rows = await prisma.churnRisk.findMany({
    where: level ? { level } : undefined,
    orderBy: { score: 'desc' },
    take: limit,
  });
  const customerIds = rows.map((r) => r.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      companyName: true,
      assignedUserId: true,
      lastContactDate: true,
      potential: true,
      status: true,
      assignedUser: { select: { fullName: true } },
    },
  });
  const byId = new Map(customers.map((c) => [c.id, c]));
  const data = rows.map((r) => ({
    ...r,
    customer: byId.get(r.customerId),
  }));
  res.json({ success: true, data });
}

export async function churnRiskCompute(req: Request, res: Response) {
  const customerId = Number(req.params.customerId);
  const result = await computeChurnRisk(customerId);
  await prisma.churnRisk.upsert({
    where: { customerId },
    update: {
      score: result.score,
      level: result.level,
      signals: result.signals as unknown as object,
      computedAt: new Date(),
    },
    create: {
      customerId,
      score: result.score,
      level: result.level,
      signals: result.signals as unknown as object,
    },
  });
  res.json({ success: true, data: result });
}

export async function churnRiskBatchRun(_req: Request, res: Response) {
  const result = await runChurnRiskBatch();
  res.json({ success: true, data: result });
}

export async function coaching(req: Request, res: Response) {
  const userId = Number(req.params.userId);
  const result = await generateCoachingInsights(userId);
  res.json({ success: true, data: result });
}

export async function status(_req: Request, res: Response) {
  try {
    const provider = await resolveProvider();
    res.json({
      success: true,
      data: {
        provider: provider.name,
        defaultModel: provider.defaultModel,
      },
    });
  } catch (err) {
    res.json({
      success: true,
      data: { provider: null, defaultModel: null, error: (err as Error).message },
    });
  }
}
