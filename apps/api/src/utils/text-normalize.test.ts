import { describe, it, expect } from 'vitest';
import {
  normalizeTr,
  tokenizeCompanyName,
  companyNameSimilarity,
  extractCorporateDomains,
} from './text-normalize';

describe('normalizeTr', () => {
  it('Turkce karakterleri ASCII\'ye dusurur', () => {
    expect(normalizeTr('Şirket Çağdaş İleri Ürün Öz')).toBe('sirket cagdas ileri urun oz');
  });
  it('Noktalama isaretlerini bosluga cevirir', () => {
    expect(normalizeTr('A.B.C. Ltd. Şti.')).toBe('a b c ltd sti');
  });
});

describe('tokenizeCompanyName - stopword filtresi', () => {
  it('Sirket tipi kelimelerini eler', () => {
    expect(tokenizeCompanyName('Ege Lojistik A.Ş.')).toEqual(['ege']);
    expect(tokenizeCompanyName('HG Trans Nakliyat Ltd. Şti.')).toEqual(['hg', 'trans']);
  });
  it('Sektor kelimelerini eler', () => {
    expect(tokenizeCompanyName('Ege İhracat A.Ş.')).toEqual(['ege']);
  });
});

describe('companyNameSimilarity - bug fix dogrulamasi', () => {
  it('"ege ihracat" vs "Ege Lojistik" -> %85+ (tek ozel ad eslesmesi)', () => {
    const score = companyNameSimilarity('ege ihracat', 'Ege Lojistik');
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('"HG Trans" vs "HG Trans Lojistik" -> %85+ (ozel ad seti tam icinde)', () => {
    const score = companyNameSimilarity('HG Trans', 'HG Trans Lojistik');
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('"test firmasi" vs "Test Firmasi A.S." -> %85+ ', () => {
    const score = companyNameSimilarity('test firmasi', 'Test Firmasi A.S.');
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('"Şirket A" vs "Sirket A" -> ayni (Turkce normalize)', () => {
    const score = companyNameSimilarity('Şirket A', 'Sirket A');
    expect(score).toBe(100);
  });

  it('Tamamen farkli isimler -> %50 alti', () => {
    const score = companyNameSimilarity('Apple', 'Microsoft');
    expect(score).toBeLessThan(50);
  });

  it('Sadece stopword icerikli -> ham karsilastirma', () => {
    const score = companyNameSimilarity('Lojistik', 'Lojistik');
    expect(score).toBe(100);
  });
});

describe('extractCorporateDomains', () => {
  it('Kurumsal alan adini cikarir, jenerik domain\'i atar', () => {
    expect(extractCorporateDomains('info@hgtrans.com, ali@gmail.com')).toEqual(['hgtrans.com']);
  });
  it('Birden fazla kurumsal domain', () => {
    expect(
      extractCorporateDomains('a@firma1.com, b@firma2.com.tr').sort(),
    ).toEqual(['firma1.com', 'firma2.com.tr']);
  });
  it('Sadece jenerik -> bos', () => {
    expect(extractCorporateDomains('a@gmail.com, b@yahoo.com')).toEqual([]);
  });
});
