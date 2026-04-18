import OpenAI from 'openai';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResult } from '@nakliye-crm/shared';
import { estimateCost, defaultModel } from '../pricing';

const BASE_URL = 'https://api.moonshot.cn/v1';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY (veya MOONSHOT_API_KEY) tanimli degil');
  client = new OpenAI({
    apiKey,
    baseURL: process.env.KIMI_BASE_URL || BASE_URL,
  });
  return client;
}

export const kimiProvider: AIProvider = {
  name: 'kimi',
  get defaultModel() {
    return defaultModel('kimi');
  },

  isConfigured() {
    return Boolean(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY);
  },

  async chat(messages: AIMessage[], opts: AIChatOptions = {}): Promise<AIChatResult> {
    const started = Date.now();
    const model = opts.model || this.defaultModel;

    const res = await getClient().chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens ?? 2048,
    });

    const text = res.choices[0]?.message?.content ?? '';
    const inputTokens = res.usage?.prompt_tokens ?? 0;
    const outputTokens = res.usage?.completion_tokens ?? 0;

    return {
      text,
      provider: 'kimi',
      model,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd: estimateCost(model, inputTokens, outputTokens),
      },
      latencyMs: Date.now() - started,
    };
  },
};
