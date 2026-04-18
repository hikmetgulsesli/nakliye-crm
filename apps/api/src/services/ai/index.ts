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
      if (p.isConfigured()) return p;
    }
  }
  // 2) Global default from DB settings
  const defaultProvider = await getSetting<string>('ai.default.provider');
  if (defaultProvider && defaultProvider in PROVIDERS) {
    const p = PROVIDERS[defaultProvider as AIProviderName];
    if (p.isConfigured()) return p;
  }
  // 3) Env fallback
  const envDefault = (process.env.AI_PROVIDER as AIProviderName | undefined) || 'claude';
  const p = PROVIDERS[envDefault];
  if (p?.isConfigured()) return p;
  // 4) First configured provider
  for (const name of Object.keys(PROVIDERS) as AIProviderName[]) {
    if (PROVIDERS[name].isConfigured()) return PROVIDERS[name];
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

export function listProvidersStatus(): Array<{
  name: AIProviderName;
  configured: boolean;
  defaultModel: string;
}> {
  return (Object.keys(PROVIDERS) as AIProviderName[]).map((n) => ({
    name: n,
    configured: PROVIDERS[n].isConfigured(),
    defaultModel: PROVIDERS[n].defaultModel,
  }));
}
