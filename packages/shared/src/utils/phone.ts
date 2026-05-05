/**
 * Turkiye telefon numarasi normalize ve format yardimcilari.
 *
 * - normalizeTrPhone: girdiyi sade rakam dizisine indirir, +90 / 0090 / 90 / 0
 *   prefix'lerini ayiklar, sonuc 10 hane olur (5XXNNNNNNN). Esitlik karsilastirmasi
 *   icin tek standart.
 * - formatTrPhone: gosterim icin "+90 (5XX) XXX XX XX" formati. Hane eksikse
 *   olabildigi kadarini formatlar (kullanici yazarken).
 * - splitMultiValue ile virgul/noktalivirgul ayraclarini destekleyen yardimci
 *   ilgili modul tarafindan kullanilir.
 */

const NON_DIGIT = /\D/g;

export function normalizeTrPhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(NON_DIGIT, '');
  if (!digits) return null;

  // 0090... -> 90...
  if (digits.startsWith('0090')) digits = digits.slice(2);
  // 90... -> 0...   (sadece bastaki "90" eger toplam 12 hane ise = +90 formati)
  if (digits.length === 12 && digits.startsWith('90')) digits = digits.slice(2);
  // 0XXXXXXXXXX -> XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  // 10 hane bekliyoruz; degilse normalize edemediysek de raw versiyonu cevap olarak
  // donmemek icin null don — caller substring/contains'e dusebilir.
  if (digits.length !== 10) return null;
  return digits;
}

/**
 * Birden fazla telefon (virgul/noktalivirgul ile) normalize edip dondurur.
 */
export function normalizeTrPhones(input: string | null | undefined): string[] {
  if (!input) return [];
  const out = new Set<string>();
  for (const part of input.split(/[,;|]+/)) {
    const n = normalizeTrPhone(part);
    if (n) out.add(n);
  }
  return [...out];
}

/**
 * Gosterim formati. 10 hane: "+90 (5XX) XXX XX XX". Tam 10 hane yoksa
 * elindekileri formatlar (input mask icin yazma sirasinda).
 */
export function formatTrPhone(input: string | null | undefined): string {
  if (!input) return '';
  const n = normalizeTrPhone(input);
  if (n) {
    return `+90 (${n.slice(0, 3)}) ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
  }
  // Normalize edilemediyse rakamlari toplayip mumkun oldugunca formatla
  let digits = input.replace(NON_DIGIT, '');
  if (digits.startsWith('0090')) digits = digits.slice(2);
  if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (!digits) return input;

  let out = '+90 (';
  out += digits.slice(0, 3);
  if (digits.length >= 3) out += ')';
  if (digits.length > 3) out += ' ' + digits.slice(3, 6);
  if (digits.length > 6) out += ' ' + digits.slice(6, 8);
  if (digits.length > 8) out += ' ' + digits.slice(8, 10);
  return out;
}

/**
 * Virgul/noktalivirgul ayrac ile birden fazla telefon iceren stringi
 * formatlanmis liste olarak doner: "+90 (555) 111 22 33, +90 (555) 444 55 66"
 */
export function formatTrPhones(input: string | null | undefined): string {
  if (!input) return '';
  const parts = input
    .split(/[,;|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((p) => formatTrPhone(p) || p).join(', ');
}
