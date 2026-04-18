import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResult } from '@nakliye-crm/shared';
import { estimateCost, defaultModel } from '../pricing';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY tanimli degil');
  client = new Anthropic({ apiKey });
  return client;
}

export const claudeProvider: AIProvider = {
  name: 'claude',
  get defaultModel() {
    return defaultModel('claude');
  },

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async chat(messages: AIMessage[], opts: AIChatOptions = {}): Promise<AIChatResult> {
    const started = Date.now();
    const model = opts.model || this.defaultModel;

    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMsgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const res = await getClient().messages.create({
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
