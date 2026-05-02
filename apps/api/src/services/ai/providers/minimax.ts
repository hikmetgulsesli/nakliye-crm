import OpenAI from 'openai';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResult } from '@nakliye-crm/shared';
import { estimateCost, defaultModel } from '../pricing';
import { getSecret } from '../../secrets.service';

const BASE_URL = 'https://api.minimax.io/v1';

let client: OpenAI | null = null;
let cachedKey: string | null = null;

async function getClient(): Promise<OpenAI> {
  const apiKey = await getSecret('minimax_api_key', 'MINIMAX_API_KEY');
  if (!apiKey) throw new Error('MiniMax API key yok — Sistem Ayarları > AI Sağlayıcılar ekranından ekleyin');
  if (!client || cachedKey !== apiKey) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.MINIMAX_BASE_URL || BASE_URL,
    });
    cachedKey = apiKey;
  }
  return client;
}

export const minimaxProvider: AIProvider = {
  name: 'minimax',
  get defaultModel() {
    return defaultModel('minimax');
  },

  async isConfigured() {
    const key = await getSecret('minimax_api_key', 'MINIMAX_API_KEY');
    return Boolean(key);
  },

  async chat(messages: AIMessage[], opts: AIChatOptions = {}): Promise<AIChatResult> {
    const started = Date.now();
    const model = opts.model || this.defaultModel;

    const c = await getClient();
    const res = await c.chat.completions.create({
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
      provider: 'minimax',
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
