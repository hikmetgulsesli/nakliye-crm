import { prisma } from "./prisma.js";

/**
 * Generate a unique quote number in format TKF-YYYY-XXXX
 * Example: TKF-2026-0001, TKF-2026-0002
 */
export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKF-${year}`;

  // Find the highest quote number for this year
  const lastQuote = await prisma.quotation.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: "desc",
    },
  });

  let nextNumber = 1;

  if (lastQuote) {
    // Extract the number part from TKF-2026-0001
    const match = lastQuote.quoteNumber.match(/TKF-\d{4}-(\d{4})/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros: 0001, 0002, etc.
  const formattedNumber = nextNumber.toString().padStart(4, "0");

  return `${prefix}-${formattedNumber}`;
}
