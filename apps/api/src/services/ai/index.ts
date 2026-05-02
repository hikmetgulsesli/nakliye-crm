import type {
  AIProvider,
  AIProviderName,
  AIMessage,
  AIChatOptions,
  AIChatResult,
  AITaskName,
} from '@nakliye-crm/shared';
import { claudeProvider } from './providers/claude';
import { openaiProvider } from './providers/openai';
import { minimaxProvider } from './providers/minimax';
import { kimiProvider } from './providers/kimi';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { getSetting } from '../system-settings.service';

const PROVIDERS: Record<AIProviderName, AIProvider> = {
  claude: claudeProvider,
  openai: openaiProvider,
  minimax: minimaxProvider,
  kimi: kimiProvider,
};

export const ALL_PROVIDERS = PROVIDERS;

export async function resolveProvider(task?: AITaskName): Promise<AIProvider> {
  // 1) Task-level override from DB settings
  if (task) {
    const taskSetting = await getSetting<string>(`ai.task.${task}.provider`);
    if (taskSetting && taskSetting in PROVIDERS) {
      const p = PROVIDERS[taskSetting as AIProviderName];
      if (await p.isConfigured()) return p;
    }
  }
  // 2) Global default from DB settings
  const defaultProvider = await getSetting<string>('ai.default.provider');
  if (defaultProvider && defaultProvider in PROVIDERS) {
    const p = PROVIDERS[defaultProvider as AIProviderName];
    if (await p.isConfigured()) return p;
  }
  // 3) Env fallback
  const envDefault = (process.env.AI_PROVIDER as AIProviderName | undefined) || 'claude';
  const p = PROVIDERS[envDefault];
  if (p && (await p.isConfigured())) return p;
  // 4) First configured provider
  for (const name of Object.keys(PROVIDERS) as AIProviderName[]) {
    if (await PROVIDERS[name].isConfigured()) return PROVIDERS[name];
  }
  throw new Error('Hicbir AI saglayicisi yapilandirilmamis (API key eksik).');
}

export async function aiChat(
  messages: AIMessage[],
  opts: AIChatOptions = {},
): Promise<AIChatResult> {
  const provider = await resolveProvider(opts.task);
  let result: AIChatResult;
  let errorMsg: string | undefined;
  try {
    result = await provider.chat(messages, opts);
  } catch (err) {
    errorMsg = (err as Error).message;
    // Cost tracking for failure too (zero usage).
    await recordUsage({
      provider: provider.name,
      model: opts.model || provider.defaultModel,
      task: opts.task,
      userId: opts.userId,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      latencyMs: 0,
      success: false,
      errorMessage: errorMsg,
    });
    throw err;
  }
  await recordUsage({
    provider: result.provider,
    model: result.model,
    task: opts.task,
    userId: opts.userId,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    costUsd: result.usage.costUsd,
    latencyMs: result.latencyMs,
    success: true,
  });
  return result;
}

interface UsageRecord {
  provider: string;
  model: string;
  task?: string;
  userId?: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
}

async function recordUsage(u: UsageRecord): Promise<void> {
  try {
    await prisma.aIUsage.create({ data: u });
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'AIUsage kayit hatasi');
  }
}

import { getSecretStatus } from '../secrets.service';

const PROVIDER_ENV_MAP: Record<AIProviderName, { secret: string; envVar: string }> = {
  claude: { secret: 'anthropic_api_key', envVar: 'ANTHROPIC_API_KEY' },
  openai: { secret: 'openai_api_key', envVar: 'OPENAI_API_KEY' },
  minimax: { secret: 'minimax_api_key', envVar: 'MINIMAX_API_KEY' },
  kimi: { secret: 'kimi_api_key', envVar: 'KIMI_API_KEY' },
};

export async function listProvidersStatusAsync(): Promise<Array<{
  name: AIProviderName;
  configured: boolean;
  source: 'env' | 'db' | null;
  lastFour: string | null;
  defaultModel: string;
}>> {
  const out = [];
  for (const name of Object.keys(PROVIDERS) as AIProviderName[]) {
    const { secret, envVar } = PROVIDER_ENV_MAP[name];
    const status = await getSecretStatus(secret, envVar);
    out.push({
      name,
      configured: status.configured,
      source: status.source,
      lastFour: status.lastFour,
      defaultModel: PROVIDERS[name].defaultModel,
    });
  }
  return out;
}

export async function listProvidersStatus(): Promise<
  Array<{
    name: AIProviderName;
    configured: boolean;
    defaultModel: string;
  }>
> {
  const names = Object.keys(PROVIDERS) as AIProviderName[];
  return Promise.all(
    names.map(async (n) => ({
      name: n,
      configured: await PROVIDERS[n].isConfigured(),
      defaultModel: PROVIDERS[n].defaultModel,
    })),
  );
}
