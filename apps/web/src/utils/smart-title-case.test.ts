import { describe, it, expect } from 'vitest';
import { smartTitleCase } from './smart-title-case';

describe('smartTitleCase', () => {
  it('All-caps girdiyi title-case yapar', () => {
    expect(smartTitleCase('ACME LOJISTIK')).toBe('Acme Lojistik');
  });

  it('Bilinen kisaltmalar buyuk kalir', () => {
    expect(smartTitleCase('msc nakliye')).toBe('MSC Nakliye');
    expect(smartTitleCase('BMW Türkiye')).toBe('BMW Türkiye');
    expect(smartTitleCase('dhl express')).toBe('DHL Express');
  });

  it('Sirket türü kısaltmaları normalize eder', () => {
    expect(smartTitleCase('acme tic. san. a.ş.')).toBe('Acme Tic. San. A.Ş.');
    expect(smartTitleCase('acme ltd şti.')).toBe('Acme Ltd. Şti.');
    expect(smartTitleCase('test as')).toBe('Test A.Ş.');
  });

  it('Türkçe karakter dogru titlecase', () => {
    expect(smartTitleCase('İSTANBUL TEKSTIL')).toBe('İstanbul Tekstil');
    expect(smartTitleCase('ŞIRKET')).toBe('Şirket');
  });

  it('All-caps 3 harfli kelime kisaltma kabul edilir', () => {
    expect(smartTitleCase('XYZ şirketi')).toBe('XYZ Şirketi');
  });

  it('Karma örnek — gerçekçi senaryo', () => {
    expect(smartTitleCase('MSC NAKLIYE LIMITED ŞTI.')).toBe('MSC Nakliye Limited Şti.');
  });

  it('Bos veya tek karakter input', () => {
    expect(smartTitleCase('')).toBe('');
    expect(smartTitleCase('a')).toBe('A');
  });

  it('Coklu boslugu temizler', () => {
    expect(smartTitleCase('  acme    lojistik  ')).toBe('Acme Lojistik');
  });
});
