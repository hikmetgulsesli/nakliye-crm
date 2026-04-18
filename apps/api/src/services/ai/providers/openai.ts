import OpenAI from 'openai';
import type { AIProvider, AIMessage, AIChatOptions, AIChatResult } from '@nakliye-crm/shared';
import { estimateCost, defaultModel } from '../pricing';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY tanimli degil');
  client = new OpenAI({ apiKey });
  return client;
}

export const openaiProvider: AIProvider = {
  name: 'openai',
  get defaultModel() {
    return defaultModel('openai');
  },

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  async chat(messages: AIMessage[], opts: AIChatOptions = {}): Promise<AIChatResult> {
    const started = Date.now();
    const model = opts.model || this.defaultModel;

    const res = await getClient().chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens ?? 2048,
      response_format: opts.responseJson ? { type: 'json_object' } : undefined,
    });

    const text = res.choices[0]?.message?.content ?? '';
    const inputTokens = res.usage?.prompt_tokens ?? 0;
    const outputTokens = res.usage?.completion_tokens ?? 0;

    return {
      text,
      provider: 'openai',
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
