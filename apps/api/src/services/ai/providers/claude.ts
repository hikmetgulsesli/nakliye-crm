import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResult } from '@nakliye-crm/shared';
import { estimateCost, defaultModel } from '../pricing';
import { getSecret, getSecretStatus } from '../../secrets.service';

let client: Anthropic | null = null;
let cachedKey: string | null = null;

async function getClient(): Promise<Anthropic> {
  const apiKey = await getSecret('anthropic_api_key', 'ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Claude API key yok — Sistem Ayarları > AI Sağlayıcılar ekranından ekleyin');
  if (!client || cachedKey !== apiKey) {
    client = new Anthropic({ apiKey });
    cachedKey = apiKey;
  }
  return client;
}

export const claudeProvider: AIProvider = {
  name: 'claude',
  get defaultModel() {
    return defaultModel('claude');
  },

  isConfigured() {
    // Async kontrol icin asilinda await gerek ama interface sync —
    // quick check: env var. DB'de key varsa gerçek kontrol chat() sırasında olur.
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async chat(messages: AIMessage[], opts: AIChatOptions = {}): Promise<AIChatResult> {
    const started = Date.now();
    const model = opts.model || this.defaultModel;

    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMsgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const c = await getClient();
    const res = await c.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature,
      system: systemMsg?.content,
      messages: chatMsgs,
    });

    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    const inputTokens = res.usage.input_tokens;
    const outputTokens = res.usage.output_tokens;

    return {
      text,
      provider: 'claude',
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
