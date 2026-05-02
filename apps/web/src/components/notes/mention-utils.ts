export interface MentionUser {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
}

/** Turkce-aware lowercase + diakritik soyma; "ŞÜK" → "suk". */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

/**
 * Metin icindeki "@Ad Soyad" tokenlerini kullanici listesiyle eslestirip
 * ID'leri dondurur. Submit aninda mentionedUserIds icin kullanilir.
 */
export function resolveMentionsFromText(text: string, users: MentionUser[]): number[] {
  if (!text || users.length === 0) return [];
  const ids = new Set<number>();
  // Bosluk sinirini kolaylastirmak icin metni paddingle
  const padded = ' ' + text + ' ';
  const haystackFolded = fold(padded);
  for (const u of users) {
    const needle = '@' + u.fullName;
    const needleFolded = fold(needle);
    let from = 0;
    while (true) {
      const idx = haystackFolded.indexOf(needleFolded, from);
      if (idx === -1) break;
      const left = padded[idx - 1];
      const right = padded[idx + needle.length];
      if (
        (left === undefined || /\s/.test(left)) &&
        (right === undefined || /\s|[.,;:!?]/.test(right))
      ) {
        ids.add(u.id);
        break;
      }
      from = idx + 1;
    }
  }
  return Array.from(ids);
}

export function scoreMatch(haystack: string, needle: string): number {
  if (haystack.startsWith(needle)) return 100;
  if (haystack.includes(' ' + needle)) return 80;
  if (haystack.includes(needle)) return 50;
  return 0;
}
