import { describe, it, expect } from 'vitest';
import { computeDiff } from '../../src/utils/diff';

describe('computeDiff', () => {
  it('returns null when nothing changed', () => {
    expect(computeDiff({ a: 1, b: 2 }, { a: 1, b: 2 })).toBeNull();
  });

  it('detects scalar change', () => {
    const diff = computeDiff({ price: 1000 }, { price: 1200 });
    expect(diff).toEqual({ price: { old: 1000, new: 1200 } });
  });

  it('ignores undefined new values', () => {
    const diff = computeDiff({ a: 1, b: 2 }, { a: 1, b: undefined });
    expect(diff).toBeNull();
  });

  it('deep-compares arrays and objects via JSON.stringify', () => {
    const diff = computeDiff(
      { countries: ['TR', 'DE'] },
      { countries: ['TR', 'DE', 'NL'] }
    );
    expect(diff).toEqual({
      countries: { old: ['TR', 'DE'], new: ['TR', 'DE', 'NL'] },
    });
  });

  it('only reports changed fields', () => {
    const diff = computeDiff(
      { a: 1, b: 2, c: 'x' },
      { a: 1, b: 9, c: 'x' }
    );
    expect(diff).toEqual({ b: { old: 2, new: 9 } });
  });
});
