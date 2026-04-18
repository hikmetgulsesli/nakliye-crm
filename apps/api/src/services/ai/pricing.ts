import type { AIProviderName } from '@nakliye-crm/shared';

/**
 * USD per 1M tokens. Indicative; update as providers change pricing.
 * Keyed by model id prefix (longest match wins).
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-haiku-4': { input: 0.8, output: 4 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  // OpenAI
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4-turbo': { input: 10, output: 30 },
  // MiniMax (USD approx; converted from CNY reference ~2024-2025)
  'abab6.5s': { input: 0.2, output: 0.8 },
  'abab7': { input: 0.4, output: 1.6 },
  // Kimi (Moonshot)
  'moonshot-v1-8k': { input: 1.65, output: 1.65 },
  'moonshot-v1-32k': { input: 3.3, output: 3.3 },
  'moonshot-v1-128k': { input: 8.25, output: 8.25 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const keys = Object.keys(PRICING).sort((a, b) => b.length - a.length);
  const match = keys.find((k) => model.startsWith(k));
  if (!match) return 0;
  const p = PRICING[match];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export function defaultModel(provider: AIProviderName): string {
  switch (provider) {
    case 'claude':
      return process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-6';
    case 'openai':
      return process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
    case 'minimax':
      return process.env.MINIMAX_DEFAULT_MODEL || 'abab6.5s-chat';
    case 'kimi':
      return process.env.KIMI_DEFAULT_MODEL || 'moonshot-v1-32k';
  }
}
