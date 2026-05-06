/**
 * Akilli title-case — firma adi alaninda "Aa" butonuyla cagrilir.
 *
 * Hedef: "MSC NAKLIYE LIMITED ŞTI." -> "MSC Nakliye Limited Şti."
 *
 * Kurallar:
 * 1) Bilinen kisaltmalar (MSC, BMW, DHL, ...) buyuk kalir.
 * 2) Sirket turu kisaltmalari normalize: a.s./as -> A.Ş., ltd -> Ltd., sti -> Şti.,
 *    tic -> Tic., san -> San.
 * 3) 2 harfli ALL-CAPS girdiler kisaltma kabul edilir (BM, AB, EU vs).
 * 4) Diger kelimeler title-case (TR-aware): ilk harf buyuk, kalanlar kucuk.
 * 5) Kelimeler arasi tek bosluk; nokta sonrasi bosluk yoksa eklenmez.
 */

const KNOWN_ABBREVIATIONS = new Set<string>([
  // Kargo/lojistik
  'MSC', 'CMA', 'CGM', 'MSK', 'COSCO', 'DHL', 'TNT', 'UPS', 'FEDEX',
  'EVER', 'YANG', 'OOCL', 'HMM', 'ZIM', 'ONE', 'PIL', 'WAN', 'HAI',
  // Otomotiv / sanayi
  'BMW', 'IBM', 'ABB', 'SKF', 'KSB', 'AEG', 'BSH', 'GE',
  // Devlet / olcekler
  'TR', 'TC', 'AB', 'EU', 'UN', 'NATO', 'ABD', 'BAE', 'BM',
  'USA', 'UK', 'GB', 'DE', 'FR', 'IT', 'CN',
  // Genel kisaltmalar
  'IFC', 'IMF', 'SAP', 'ERP', 'CRM', 'IT', 'BT',
]);

/**
 * Sirket turu kisaltmalari — input'taki rasgele varyantlari standart yaziya
 * cevirir. Hem nokta'lı hem noktasız kabul.
 */
const COMPANY_SUFFIX_NORMALIZER: Record<string, string> = {
  'a.s': 'A.Ş.',
  'a.s.': 'A.Ş.',
  'a.ş': 'A.Ş.',
  'a.ş.': 'A.Ş.',
  'as': 'A.Ş.',
  'aş': 'A.Ş.',
  'ltd': 'Ltd.',
  'ltd.': 'Ltd.',
  'limited': 'Limited',
  'sti': 'Şti.',
  'sti.': 'Şti.',
  'şti': 'Şti.',
  'şti.': 'Şti.',
  'tic': 'Tic.',
  'tic.': 'Tic.',
  'san': 'San.',
  'san.': 'San.',
  'sanayi': 'Sanayi',
  'ticaret': 'Ticaret',
  'ihr': 'İhr.',
  'ith': 'İth.',
  'ihr.': 'İhr.',
  'ith.': 'İth.',
  'co': 'Co.',
  'co.': 'Co.',
  'corp': 'Corp.',
  'corp.': 'Corp.',
  'inc': 'Inc.',
  'inc.': 'Inc.',
  'gmbh': 'GmbH',
};

const TR_UPPER_MAP: Record<string, string> = {
  i: 'İ', ı: 'I',
  ş: 'Ş', ç: 'Ç', ğ: 'Ğ', ü: 'Ü', ö: 'Ö',
};

// Onemli: ASCII 'I' kullanici "NAKLIYE" yazdiginda dogal beklenti "Nakliye"
// (ASCII i). TR I/ı ayrimi yalniz `İ` -> `i` icin gecerli.
const TR_LOWER_MAP: Record<string, string> = {
  İ: 'i',
  Ş: 'ş', Ç: 'ç', Ğ: 'ğ', Ü: 'ü', Ö: 'ö',
};

function trUpperFirst(s: string): string {
  if (!s) return s;
  const first = TR_UPPER_MAP[s[0]] ?? s[0].toUpperCase();
  const rest = s
    .slice(1)
    .split('')
    .map((ch) => TR_LOWER_MAP[ch] ?? ch.toLowerCase())
    .join('');
  return first + rest;
}

function isAllUpperLetters(token: string): boolean {
  // Sadece harflerden olusan ve hepsi buyuk harf olan kelime (TR dahil)
  if (token.length < 2) return false;
  const lettersOnly = token.replace(/[.\-]/g, '');
  if (!lettersOnly) return false;
  for (const ch of lettersOnly) {
    if (!/\p{L}/u.test(ch)) return false;
    if (ch !== (TR_UPPER_MAP[ch] ?? ch.toUpperCase())) return false;
  }
  return true;
}

export function smartTitleCase(input: string): string {
  if (!input) return input;
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) return trimmed;

  const tokens = trimmed.split(' ');
  const out: string[] = [];

  for (const raw of tokens) {
    const lower = raw.toLowerCase();

    // 1) Sirket turu kisaltmasi — ozel normalize
    if (COMPANY_SUFFIX_NORMALIZER[lower] !== undefined) {
      out.push(COMPANY_SUFFIX_NORMALIZER[lower]);
      continue;
    }

    // 2) Bilinen kisaltma (case-insensitive bakar) — buyuk hali
    const upperRaw = raw.toUpperCase();
    if (KNOWN_ABBREVIATIONS.has(upperRaw)) {
      out.push(upperRaw);
      continue;
    }

    // 3) Tamamen buyuk yazilmis 2-3 harfli kelime — kisaltma sayilir,
    //    aynen koru. Bu MSC/BMW gibi listede olmayan kisaltmalari da yakalar.
    //    4 harf cogu firma adinin (ACME, AKER, ARGE) ilk harfi all-caps yazimi
    //    olabildigi icin sinir 3 harf — 4+ harfli "gerçek" kisaltmalar zaten
    //    KNOWN_ABBREVIATIONS listesinde.
    if (raw.length >= 2 && raw.length <= 3 && isAllUpperLetters(raw)) {
      out.push(raw);
      continue;
    }

    // 4) Title-case (TR-aware)
    out.push(trUpperFirst(raw));
  }

  return out.join(' ');
}
