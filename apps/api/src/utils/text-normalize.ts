/**
 * Mukerrer kayit kontrolu icin metin normalize ve karsilastirma yardimcilari.
 *
 * - normalizeTr: Turkce karakterleri ASCII'ye dusurur, lowercase yapar, fazla
 *   boslugu temizler, noktalama isaretlerini bosluga cevirir.
 * - tokenizeCompanyName: stopword'leri (lojistik, a.s., ltd., san., tic. ...)
 *   eler; ayirici kelimeleri dondurur. Cok firma adinda bu kelimeler ortaktir,
 *   benzerlik skorunu sismelerini onler.
 * - companyNameSimilarity: 0-100 arasi skor; ozel ad eslesmesinde dogru sonuc
 *   verir. Eski algoritmadan iki fark:
 *     1) stopword filtresi
 *     2) ozel ad tek bile olsa eslesirse %100 sayar (ornek: "ege ihracat" vs
 *        "ege Lojistik" -> ozel ad "ege" tek -> %100)
 */

const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
};

export function normalizeTr(input: string): string {
  if (!input) return '';
  let s = '';
  for (const ch of input) {
    s += TR_MAP[ch] ?? ch;
  }
  // Noktalama -> bosluk, lowercase, coklu bosluk -> tek
  s = s
    .toLowerCase()
    .replace(/[.,;:!?'"()[\]{}/\\|*_+=<>@#$%^&~`]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

/**
 * Sirket adlarinda her firmada gecen jenerik kelimeler. Ayirt edici degildir;
 * benzerlik hesabinda eler. (Hepsi normalizeTr cikislidir — TR karaktersiz.)
 */
const COMPANY_STOPWORDS = new Set([
  // Sektor
  'lojistik', 'nakliyat', 'nakliye', 'tasimacilik', 'tasima',
  'ihracat', 'ithalat', 'ticaret', 'tic',
  'sanayi', 'san',
  'gida', 'tekstil', 'insaat', 'enerji',
  // Sirket tipi
  'as', 'a s', // a.s.
  'ltd', 'sti', 'sti.', 'limited',
  'co', 'corp', 'corporation', 'company', 'inc',
  'gmbh', 'sa', 'srl',
  // Genel
  'global', 'international', 'intl', 'group', 'grup', 'holding',
  've', 'and', 'the',
]);

/**
 * Sirket adini token'lara ayir, stopword'leri ele.
 * En az 2 karakter olan ve stopword listesinde olmayan kelimeleri dondurur.
 */
export function tokenizeCompanyName(input: string): string[] {
  const normalized = normalizeTr(input);
  if (!normalized) return [];
  return normalized
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !COMPANY_STOPWORDS.has(w));
}

/**
 * 0-100 arasi benzerlik skoru.
 *
 * Mantik:
 *  - Iki tarafi da tokenize et (stopword cikar)
 *  - Tam eslesen kelimeler -> 1 puan
 *  - Bir kelime digerini iceriyorsa (>=3 char) -> 0.7 puan
 *  - Skor = matchCount / max(tokenSayisi)
 *  - Ozel kural: bir taraf tek ozel ada dustugu icin (ornek "Ege") ve diger
 *    tarafta da o ad varsa, kullanici acisindan %100 ayni firma demektir.
 */
export function companyNameSimilarity(a: string, b: string): number {
  const tokensA = tokenizeCompanyName(a);
  const tokensB = tokenizeCompanyName(b);

  if (tokensA.length === 0 || tokensB.length === 0) {
    // Stopword'siz hicbir sey kalmadi -> ham karsilastirma
    const na = normalizeTr(a);
    const nb = normalizeTr(b);
    if (!na || !nb) return 0;
    if (na === nb) return 100;
    if (na.includes(nb) || nb.includes(na)) return 80;
    return 0;
  }

  let matchCount = 0;
  const usedB = new Set<number>();

  for (const ta of tokensA) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < tokensB.length; i++) {
      if (usedB.has(i)) continue;
      const tb = tokensB[i];
      let score = 0;
      if (ta === tb) score = 1;
      else if (ta.length >= 3 && tb.length >= 3 && (ta.includes(tb) || tb.includes(ta))) {
        score = 0.7;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      usedB.add(bestIdx);
      matchCount += bestScore;
    }
  }

  const totalTokens = Math.max(tokensA.length, tokensB.length);
  const baseScore = (matchCount / totalTokens) * 100;

  // Ozel ad heuristik: stopword'siz tek kelime kalan tarafin tek ozel adi
  // diger tarafin token'lari arasinda tam mevcutsa, kullanici icin "ayni firma"
  // demektir — skoru yukari cek.
  if (tokensA.length === 1 || tokensB.length === 1) {
    const single = tokensA.length === 1 ? tokensA[0] : tokensB[0];
    const otherTokens = tokensA.length === 1 ? tokensB : tokensA;
    if (otherTokens.includes(single)) {
      return Math.max(baseScore, 90);
    }
  }

  return Math.round(baseScore);
}

/**
 * E-posta listesinden alan adlarini cikar (jenerik domain'ler haric).
 * "info@hgtrans.com, sales@hgtrans.com" -> ["hgtrans.com"]
 */
const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.com.tr', 'ymail.com',
  'icloud.com', 'me.com',
  'yandex.com', 'yandex.com.tr', 'mail.ru',
  'protonmail.com', 'proton.me',
]);

export function extractCorporateDomains(emailField: string | null | undefined): string[] {
  if (!emailField) return [];
  const domains = new Set<string>();
  const parts = emailField.split(/[,;|]+/);
  for (const part of parts) {
    const at = part.indexOf('@');
    if (at < 0) continue;
    const domain = part.slice(at + 1).trim().toLowerCase();
    if (!domain || domain.length < 4) continue;
    if (GENERIC_EMAIL_DOMAINS.has(domain)) continue;
    domains.add(domain);
  }
  return [...domains];
}
