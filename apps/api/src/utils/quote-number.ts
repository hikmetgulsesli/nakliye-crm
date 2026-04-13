import { prisma } from '../config/database';

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKF-${year}-`;

  const lastQuote = await prisma.quotation.findFirst({
    where: { quoteNo: { startsWith: prefix } },
    orderBy: { quoteNo: 'desc' },
  });

  let nextNum = 1;
  if (lastQuote) {
    const lastNum = parseInt(lastQuote.quoteNo.replace(prefix, ''), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}
