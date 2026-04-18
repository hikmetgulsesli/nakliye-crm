import { describe, it, expect } from 'vitest';
import { estimateCost, defaultModel } from '../../src/services/ai/pricing';

describe('AI pricing', () => {
  it('returns 0 for unknown model', () => {
    expect(estimateCost('unknown-model-xyz', 1000, 500)).toBe(0);
  });

  it('computes Claude Sonnet cost (3 USD/M input, 15 USD/M output)', () => {
    // 100k input + 50k output
    const cost = estimateCost('claude-sonnet-4-6', 100_000, 50_000);
    // Expected: 0.3 + 0.75 = 1.05 USD
    expect(cost).toBeCloseTo(1.05, 4);
  });

  it('computes GPT-4o-mini cost (cheap)', () => {
    const cost = estimateCost('gpt-4o-mini', 1_000_000, 500_000);
    // 0.15 + 0.3 = 0.45 USD
    expect(cost).toBeCloseTo(0.45, 4);
  });

  it('prefers longest prefix match', () => {
    // claude-3-5-sonnet should match 'claude-3-5-sonnet', not 'claude' only
    const cost = estimateCost('claude-3-5-sonnet-20241022', 1_000_000, 0);
    expect(cost).toBeCloseTo(3, 4);
  });
});

describe('AI defaultModel', () => {
  it('returns provider-specific default', () => {
    expect(defaultModel('claude')).toMatch(/claude/);
    expect(defaultModel('openai')).toMatch(/gpt/);
    expect(defaultModel('minimax')).toMatch(/abab/);
    expect(defaultModel('kimi')).toMatch(/moonshot/);
  });
});
