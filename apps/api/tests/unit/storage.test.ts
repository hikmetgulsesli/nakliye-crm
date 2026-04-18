import { describe, it, expect } from 'vitest';
import { buildKey, isStorageConfigured } from '../../src/services/storage.service';

describe('storage.buildKey', () => {
  it('includes ownerType and ownerId prefix', () => {
    const key = buildKey({ ownerType: 'customer', ownerId: 42, originalName: 'foo.pdf' });
    expect(key.startsWith('customer/42/')).toBe(true);
  });

  it('sanitizes original name (removes unsafe chars in filename part)', () => {
    const key = buildKey({ ownerType: 'shipment', ownerId: 1, originalName: 'my file / weird? name.pdf' });
    const filename = key.split('/').pop()!;
    expect(filename).not.toMatch(/[?\s]/);
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('produces unique keys for same input (timestamp+rand)', () => {
    const a = buildKey({ ownerType: 'q', ownerId: 1, originalName: 'x.pdf' });
    const b = buildKey({ ownerType: 'q', ownerId: 1, originalName: 'x.pdf' });
    expect(a).not.toBe(b);
  });

  it('trims excessively long names to last 80 chars', () => {
    const long = 'a'.repeat(200) + '.pdf';
    const key = buildKey({ ownerType: 'q', ownerId: 1, originalName: long });
    const filePart = key.split('/').pop()!;
    // stamp-rand-filename; filename is capped at 80 chars
    expect(filePart.length).toBeLessThan(150);
  });
});

describe('storage.isStorageConfigured', () => {
  it('returns boolean', () => {
    expect(typeof isStorageConfigured()).toBe('boolean');
  });
});
