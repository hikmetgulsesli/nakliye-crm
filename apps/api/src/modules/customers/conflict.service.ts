import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { splitMultiValue } from '@nakliye-crm/shared';

interface ConflictResult {
  customerId: number;
  companyName: string;
  contactName: string | null;
  phone: string;
  email: string;
  assignedUserId: number;
  assignedUserName: string;
  lastContactDate: Date | null;
  matchType: 'company_name' | 'phone' | 'email';
  similarity: number;
}

export async function checkConflicts(req: Request, res: Response) {
  const { companyName, phone, email } = req.body;
  const matches: ConflictResult[] = [];

  // 1. Fuzzy company name match using SQL LIKE with wildcards
  if (companyName) {
    const nameParts = String(companyName).trim().split(/\s+/);
    const nameConditions = nameParts
      .filter((p: string) => p.length >= 3)
      .map((part: string) => ({
        companyName: { contains: part, mode: 'insensitive' as const },
      }));

    if (nameConditions.length > 0) {
      const nameMatches = await prisma.customer.findMany({
        where: {
          OR: nameConditions,
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
      });

      for (const c of nameMatches) {
        const similarity = calculateNameSimilarity(
          companyName.toLowerCase(),
          c.companyName.toLowerCase()
        );
        // PRD v3: %80+ benzerlik uyari verir
        if (similarity >= 80) {
          matches.push({
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
            matchType: 'company_name',
            similarity,
          });
        }
      }
    }
  }

  // 2. Exact phone match (her bir parça için ayrı sorgu)
  if (phone) {
    const phoneParts = splitMultiValue(String(phone))
      .map((p) => p.replace(/[\s\-()]/g, ''))
      .filter((p) => p.length >= 10);

    if (phoneParts.length > 0) {
      const phoneMatches = await prisma.customer.findMany({
        where: {
          OR: phoneParts.map((p) => ({ phone: { contains: p } })),
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
      });

      for (const c of phoneMatches) {
        if (!matches.find((m) => m.customerId === c.id)) {
          matches.push({
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
            matchType: 'phone',
            similarity: 100,
          });
        }
      }
    }
  }

  // 3. Case-insensitive email match (her bir parça için ayrı sorgu)
  if (email) {
    const emailParts = splitMultiValue(String(email));

    if (emailParts.length > 0) {
      const emailMatches = await prisma.customer.findMany({
        where: {
          OR: emailParts.map((p) => ({ email: { contains: p, mode: 'insensitive' as const } })),
          isDeleted: false,
        },
        include: {
          assignedUser: { select: { fullName: true } },
        },
      });

      for (const c of emailMatches) {
        if (!matches.find((m) => m.customerId === c.id)) {
          matches.push({
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserId: c.assignedUserId,
            assignedUserName: c.assignedUser.fullName,
            lastContactDate: c.lastContactDate,
            matchType: 'email',
            similarity: 100,
          });
        }
      }
    }
  }

  // Sort by similarity descending
  matches.sort((a, b) => b.similarity - a.similarity);

  res.json({ success: true, data: matches });
}

/**
 * Simple similarity calculation based on common words
 */
function calculateNameSimilarity(input: string, existing: string): number {
  const inputWords = input.split(/\s+/).filter((w) => w.length >= 2);
  const existingWords = existing.split(/\s+/).filter((w) => w.length >= 2);

  if (inputWords.length === 0 || existingWords.length === 0) return 0;

  let matchCount = 0;
  for (const iw of inputWords) {
    for (const ew of existingWords) {
      if (iw === ew) {
        matchCount++;
        break;
      }
      // Partial match (one contains the other)
      if (iw.length >= 3 && ew.length >= 3 && (iw.includes(ew) || ew.includes(iw))) {
        matchCount += 0.7;
        break;
      }
    }
  }

  const totalWords = Math.max(inputWords.length, existingWords.length);
  return Math.round((matchCount / totalWords) * 100);
}
