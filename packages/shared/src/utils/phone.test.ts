import { describe, it, expect } from 'vitest';
import { normalizeTrPhone, formatTrPhone, formatTrPhones, normalizeTrPhones } from './phone';

describe('normalizeTrPhone', () => {
  it('+90 ile baslayan ulusal formati 10 haneye indirir', () => {
    expect(normalizeTrPhone('+90 555 123 45 67')).toBe('5551234567');
    expect(normalizeTrPhone('+905551234567')).toBe('5551234567');
  });
  it('0090 international prefix', () => {
    expect(normalizeTrPhone('0090 555 123 45 67')).toBe('5551234567');
  });
  it('Bastaki 0 prefix', () => {
    expect(normalizeTrPhone('0555 123 45 67')).toBe('5551234567');
  });
  it('Sadece 10 hane', () => {
    expect(normalizeTrPhone('5551234567')).toBe('5551234567');
  });
  it('Parantez ve tire icerse de normalize', () => {
    expect(normalizeTrPhone('(0555) 123-45-67')).toBe('5551234567');
  });
  it('Eksik hane -> null', () => {
    expect(normalizeTrPhone('555 123')).toBe(null);
  });
  it('Bos input -> null', () => {
    expect(normalizeTrPhone('')).toBe(null);
    expect(normalizeTrPhone(null as unknown as string)).toBe(null);
  });
  it('Farkli ulkenin numarasi -> null (10 haneden farkli)', () => {
    expect(normalizeTrPhone('+1 415 555 1234')).toBe(null);
  });
});

describe('formatTrPhone', () => {
  it('Tam numarayi okunakli forma cevirir', () => {
    expect(formatTrPhone('5551234567')).toBe('+90 (555) 123 45 67');
    expect(formatTrPhone('+905551234567')).toBe('+90 (555) 123 45 67');
  });
  it('Yarim girdi: kismi format dondurur', () => {
    expect(formatTrPhone('555')).toContain('555');
  });
});

describe('formatTrPhones - virgul listesi', () => {
  it('Birden fazla telefonu liste olarak formatlar', () => {
    expect(formatTrPhones('5551234567, 5559876543')).toBe(
      '+90 (555) 123 45 67, +90 (555) 987 65 43',
    );
  });
});

describe('normalizeTrPhones', () => {
  it('Coklu girdi normalize edip tekillestirir', () => {
    expect(normalizeTrPhones('+905551234567, 0555 123 45 67').sort()).toEqual(['5551234567']);
  });
});
