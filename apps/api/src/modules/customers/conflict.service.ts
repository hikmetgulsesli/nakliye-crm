import { Request, Response } from 'express';
import { prisma } from '../../config/database';

interface ConflictResult {
  customerId: number;
  companyName: string;
  contactName: string | null;
  phone: string;
  email: string;
  assignedUserName: string;
  matchType: string;
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
        if (similarity >= 40) {
          matches.push({
            customerId: c.id,
            companyName: c.companyName,
            contactName: c.contactName,
            phone: c.phone,
            email: c.email,
            assignedUserName: c.assignedUser.fullName,
            matchType: 'company_name',
            similarity,
          });
        }
      }
    }
  }

  // 2. Exact phone match
  if (phone) {
    const normalizedPhone = String(phone).replace(/[\s\-\(\)]/g, '');
    const phoneMatches = await prisma.customer.findMany({
      where: {
        phone: { contains: normalizedPhone },
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
          assignedUserName: c.assignedUser.fullName,
          matchType: 'phone',
          similarity: 100,
        });
      }
    }
  }

  // 3. Case-insensitive email match
  if (email) {
    const emailMatches = await prisma.customer.findMany({
      where: {
        email: { equals: String(email), mode: 'insensitive' },
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
          assignedUserName: c.assignedUser.fullName,
          matchType: 'email',
          similarity: 100,
        });
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
