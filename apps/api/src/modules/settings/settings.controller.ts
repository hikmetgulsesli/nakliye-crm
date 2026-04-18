import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import {
  getManySettings,
  setSetting,
} from '../../services/system-settings.service';
import { listProvidersStatus } from '../../services/ai';
import { isStorageConfigured } from '../../services/storage.service';
import { createAuditLog } from '../../utils/audit';
import { FEATURES, CATEGORY_LABELS, getAllFeatures, type FeatureKey } from '../../services/features.service';

/**
 * Sistem Ayarlari — tek bir controller altinda tum toggle + non-sensitive
 * konfigurasyon. API key ve DSN gibi hassas degerler env'den gelir;
 * burada sadece "enabled/disabled", "default provider", "threshold" yonetilir.
 */

const KEYS = {
  // AI
  aiEnabled: 'ai.enabled',
  aiDefaultProvider: 'ai.default.provider',
  aiTaskDraftEmail: 'ai.task.draft-email.provider',
  aiTaskWinProbability: 'ai.task.win-probability.provider',
  aiTaskChurnRisk: 'ai.task.churn-risk.provider',
  aiTaskCoaching: 'ai.task.coaching.provider',
  aiDailyBudgetUsd: 'ai.daily_budget_usd',
  // Notifications scheduler
  notifEnabled: 'notifications.enabled',
  notifUncontactedDays: 'notifications.uncontacted_days',
  notifPendingQuoteDays: 'notifications.pending_quote_days',
  notifHighPotentialDays: 'notifications.high_potential_days',
  // Email (Resend / SMTP) — SADECE enable toggle + defaults
  emailEnabled: 'email.enabled',
  emailDailyDigest: 'email.daily_digest',
  emailFromAddress: 'email.from_address',
  // WhatsApp
  whatsappEnabled: 'whatsapp.enabled',
  // SMS
  smsEnabled: 'sms.enabled',
  // Exchange rate (TCMB)
  exchangeRatesEnabled: 'exchange_rates.enabled',
} as const;

export async function getAll(_req: Request, res: Response) {
  const keys = Object.values(KEYS);
  const values = await getManySettings(keys as unknown as string[]);

  // Service health status (env-based, read-only)
  const aiProviders = listProvidersStatus();
  const integrations = {
    sentry: {
      backend: Boolean(process.env.SENTRY_DSN),
    },
    redis: {
      configured: Boolean(process.env.REDIS_URL) || process.env.USE_REDIS !== 'false',
    },
    storage: {
      configured: isStorageConfigured(),
      endpoint: process.env.S3_ENDPOINT ? maskUrl(process.env.S3_ENDPOINT) : null,
      bucket: process.env.S3_BUCKET || null,
    },
    email: {
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      smtpConfigured: Boolean(process.env.SMTP_HOST),
    },
    whatsapp: {
      twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    },
    sms: {
      netgsmConfigured: Boolean(process.env.NETGSM_USER),
    },
  };

  res.json({
    success: true,
    data: {
      settings: values,
      integrations,
      aiProviders,
    },
  });
}

export async function update(req: Request, res: Response) {
  const { key, value } = req.body as { key: string; value: unknown };
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ success: false, message: 'key gerekli' });
  }
  // Allow-list: known settings + tum feature flag'ler
  const allowed = Object.values(KEYS) as string[];
  const featureKeys = Object.keys(FEATURES).map((f) => `features.${f}`);
  if (!allowed.includes(key) && !featureKeys.includes(key)) {
    return res.status(400).json({ success: false, message: `Bilinmeyen ayar: ${key}` });
  }
  await setSetting(key, value, req.user?.userId);

  await createAuditLog({
    userId: req.user!.userId,
    recordType: 'SystemSetting',
    recordId: 0,
    action: 'UPDATE',
    changes: { [key]: { old: null, new: value } },
  });

  res.json({ success: true, data: { key, value } });
}

export async function listFeatures(_req: Request, res: Response) {
  const values = await getAllFeatures();
  const byCategory: Record<string, Array<{ key: FeatureKey; label: string; enabled: boolean; default: boolean }>> = {};
  for (const [key, meta] of Object.entries(FEATURES) as Array<
    [FeatureKey, { default: boolean; category: string; label: string }]
  >) {
    if (!byCategory[meta.category]) byCategory[meta.category] = [];
    byCategory[meta.category].push({
      key,
      label: meta.label,
      default: meta.default,
      enabled: values[key],
    });
  }
  res.json({
    success: true,
    data: {
      categories: Object.entries(byCategory).map(([cat, items]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
        items,
      })),
    },
  });
}

/**
 * Frontend'in hangi feature'lar aktif/pasif oldugunu tek seferde ogrenmesi
 * icin basit endpoint (auth'lu herkese acik — sadece feature listesi, sirri yok).
 */
export async function getFeatureFlags(_req: Request, res: Response) {
  const values = await getAllFeatures();
  res.json({ success: true, data: values });
}

export async function aiUsageReport(req: Request, res: Response) {
  const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [byProvider, byTask, recent, totals] = await Promise.all([
    prisma.aIUsage.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true, costUsd: true },
      _count: { _all: true },
    }),
    prisma.aIUsage.groupBy({
      by: ['task'],
      where: { createdAt: { gte: since } },
      _sum: { totalTokens: true, costUsd: true },
      _count: { _all: true },
    }),
    prisma.aIUsage.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.aIUsage.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true, totalTokens: true },
      _count: { _all: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      since: since.toISOString(),
      totals: {
        calls: totals._count._all,
        tokens: totals._sum.totalTokens ?? 0,
        costUsd: totals._sum.costUsd ?? 0,
      },
      byProvider,
      byTask,
      recent,
    },
  });
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//***.${u.hostname.split('.').slice(-2).join('.')}`;
  } catch {
    return url.slice(0, 20) + '…';
  }
}
