import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { splitMultiValue, normalizeTrPhones } from '@nakliye-crm/shared';
import {
  normalizeTr,
  tokenizeCompanyName,
  companyNameSimilarity,
  extractCorporateDomains,
} from '../../utils/text-normalize';

export type ConflictMatchType = 'company_name' | 'phone' | 'email' | 'email_domain';
export type ConflictSeverity = 'definite' | 'likely';

export interface ConflictResult {
  customerId: number;
  companyName: string;
  contactName: string | null;
  phone: string;
  email: string;
  assignedUserId: number;
  assignedUserName: string;
  lastContactDate: Date | null;
  matchType: ConflictMatchType;
  similarity: number;
  severity: ConflictSeverity; // 'definite' = ADMIN onay gerekir, 'likely' = USER bypass edebilir
  matchedOn?: string;         // tooltip icin: "0532 111 22 33", "@hgtrans.com" vs.
}

// %85 + uzeri = "kesin ayni firma" -> ADMIN onayi zorunlu
// %50 - 84  = "muhtemel ayni"      -> USER bypass edebilir
const DEFINITE_THRESHOLD = 85;
const LIKELY_THRESHOLD = 50;

function severityFor(similarity: number): ConflictSeverity {
  return similarity >= DEFINITE_THRESHOLD ? 'definite' : 'likely';
}

/**
 * Mevcut bir musterinin conflict cevabini olustur. Ayni musteri farkli
 * sebeplerle eslesmis olabilir (telefon + e-posta domain) -> en yuksek severity'i tut.
 */
function upsertMatch(
  matches: Map<number, ConflictResult>,
  base: Omit<ConflictResult, 'matchType' | 'similarity' | 'severity' | 'matchedOn'>,
  matchType: ConflictMatchType,
  similarity: number,
  matchedOn?: string,
) {
  const existing = matches.get(base.customerId);
  const severity = severityFor(similarity);
  if (!existing || similarity > existing.similarity) {
    matches.set(base.customerId, {
      ...base,
      matchType,
      similarity,
      severity,
      matchedOn,
    });
  }
}

export interface FindConflictsInput {
  companyName?: string;
  phone?: string;
  email?: string;
  excludeCustomerId?: number;
}

/**
 * Saf is mantigi: girdiye gore eslesen musterileri dondurur.
 * Hem POST /conflict-check route'u hem create controller'i (sunucu-tarafi
 * sondaj) bu fonksiyonu kullanir, boylece kural tek kaynaktan.
 */
export async function findCustomerConflicts(input: FindConflictsInput): Promise<ConflictResult[]> {
  const { companyName, phone, email, excludeCustomerId } = input;
  const matches = new Map<number, ConflictResult>();

  // ========== 1. Firma adi (fuzzy) ==========
  if (companyName && companyName.trim().length >= 2) {
    const tokens = tokenizeCompanyName(companyName);
    const fallbackParts = normalizeTr(companyName).split(/\s+/).filter((p) => p.length >= 2);
    const searchTerms = tokens.length > 0 ? tokens : fallbackParts;

    if (searchTerms.length > 0) {
      // Aday seti - bir kelime bile gecse aday say (sonra benzerlik filtreleyecek)
      const nameMatches = await prisma.customer.findMany({
        where: {
          OR: searchTerms.map((part) => ({
            companyName: { contains: part, mode: 'insensitive' as const },
          })),
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
        take: 200, // guvenlik tavani
      });

      for (const c of nameMatches) {
        const similarity = companyNameSimilarity(companyName, c.companyName);
        if (similarity >= LIKELY_THRESHOLD) {
          upsertMatch(
            matches,
            {
              customerId: c.id,
              companyName: c.companyName,
              contactName: c.contactName,
              phone: c.phone,
              email: c.email,
              assignedUserId: c.assignedUserId,
              assignedUserName: c.assignedUser.fullName,
              lastContactDate: c.lastContactDate,
            },
            'company_name',
            similarity,
            c.companyName,
          );
        }
      }
    }
  }

  // ========== 2. Telefon (normalize edilmis tam eslesme) ==========
  if (phone) {
    const normalizedPhones = normalizeTrPhones(phone);

    // Normalize edilemeyen parcalar varsa (10 haneye dusmuyorsa) ham haliyle de
    // contains kontrolu yap — guvenlik kemeri.
    const rawParts = splitMultiValue(String(phone))
      .map((p) => p.replace(/[\s\-()]/g, ''))
      .filter((p) => p.length >= 10);

    if (normalizedPhones.length > 0 || rawParts.length > 0) {
      const phoneMatches = await prisma.customer.findMany({
        where: {
          OR: [
            ...normalizedPhones.map((n) => ({ phone: { contains: n } })),
            ...rawParts.map((p) => ({ phone: { contains: p } })),
          ],
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
        take: 50,
      });

      for (const c of phoneMatches) {
        // Asil esitlik testi normalize edilmis numaralar uzerinden
        const cPhones = normalizeTrPhones(c.phone);
        let matched: string | null = null;
        for (const np of normalizedPhones) {
          if (cPhones.includes(np)) {
            matched = np;
            break;
          }
        }
        // Normalize ile yakalanmadiysa raw substring zaten Prisma OR'da yakalandi
        if (!matched && rawParts.length > 0) {
          for (const r of rawParts) {
            if (c.phone.replace(/[\s\-()]/g, '').includes(r)) {
              matched = r;
              break;
            }
          }
        }

        upsertMatch(
          matches,
          {
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
          },
          'phone',
          100,
          matched ?? c.phone,
        );
      }
    }
  }

  // ========== 3. E-posta (tam) + alan adi (info) ==========
  if (email) {
    const emailParts = splitMultiValue(String(email)).filter((e) => /@.+\./.test(e));

    // 3a. Tam adres eslesmesi (case-insensitive)
    if (emailParts.length > 0) {
      const exactMatches = await prisma.customer.findMany({
        where: {
          OR: emailParts.map((p) => ({
            email: { contains: p, mode: 'insensitive' as const },
          })),
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
        take: 50,
      });

      for (const c of exactMatches) {
        const matchedEmail = emailParts.find((p) =>
          c.email.toLowerCase().includes(p.toLowerCase()),
        );
        upsertMatch(
          matches,
          {
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
          },
          'email',
          100,
          matchedEmail ?? c.email,
        );
      }
    }

    // 3b. Kurumsal alan adi (info uyari, definite degil)
    const corporateDomains = extractCorporateDomains(email);
    if (corporateDomains.length > 0) {
      const domainMatches = await prisma.customer.findMany({
        where: {
          OR: corporateDomains.map((d) => ({
            email: { contains: '@' + d, mode: 'insensitive' as const },
          })),
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
        take: 50,
      });

      for (const c of domainMatches) {
        // Eger ayni musteri zaten 'email' ile esleti (ayni adres) -> dokunma
        const existing = matches.get(c.id);
        if (existing && existing.matchType === 'email') continue;

        const matchedDomain = corporateDomains.find((d) =>
          c.email.toLowerCase().includes('@' + d),
        );

        upsertMatch(
          matches,
          {
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
          },
          'email_domain',
          70, // alan adi ortakligi: "muhtemel ayni firma"
          matchedDomain ? '@' + matchedDomain : c.email,
        );
      }
    }
  }

  if (excludeCustomerId) {
    matches.delete(excludeCustomerId);
  }

  return [...matches.values()].sort((a, b) => b.similarity - a.similarity);
}

export async function checkConflicts(req: Request, res: Response) {
  const { companyName, phone, email } = req.body as {
    companyName?: string;
    phone?: string;
    email?: string;
  };
  const sorted = await findCustomerConflicts({ companyName, phone, email });
  res.json({ success: true, data: sorted });
}
