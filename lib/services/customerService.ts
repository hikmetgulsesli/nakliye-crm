import { prisma } from '@/lib/prisma'

/**
 * Update the lastContactDate for a customer
 * Called when activities like calls, emails, meetings are logged
 */
export async function updateLastContactDate(customerId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastContactDate: new Date() },
  })
}

/**
 * Update the lastQuoteDate for a customer
 * Called when a new quotation is created for the customer
 */
export async function updateLastQuoteDate(customerId: string): Promise<void> {
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastQuoteDate: new Date() },
  })
}

/**
 * Check if a customer exists by ID
 */
export async function customerExists(customerId: string): Promise<boolean> {
  const count = await prisma.customer.count({
    where: { id: customerId },
  })
  return count > 0
}

/**
 * Calculate fuzzy similarity between two strings using Levenshtein distance
 * Returns similarity percentage (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 100
  
  const len1 = s1.length
  const len2 = s2.length
  const maxLen = Math.max(len1, len2)
  
  if (maxLen === 0) return 100
  
  // Calculate Levenshtein distance
  const matrix: number[][] = []
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  
  const distance = matrix[len1][len2]
  const similarity = ((maxLen - distance) / maxLen) * 100
  
  return Math.round(similarity)
}

/**
 * Find potential duplicate customers based on company name, email, or phone
 * Uses 80% similarity threshold for company name matching
 */
export async function findPotentialDuplicates(
  companyName: string,
  email?: string,
  phone?: string,
  excludeId?: string
): Promise<Array<{
  customer: {
    id: string
    companyName: string
    email: string
    phone: string | null
    status: string
  }
  similarity: number
  matchedFields: string[]
}>> {
  const customers = await prisma.customer.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: {
      id: true,
      companyName: true,
      email: true,
      phone: true,
      status: true,
    },
  })
  
  const duplicates: Array<{
    customer: {
      id: string
      companyName: string
      email: string
      phone: string | null
      status: string
    }
    similarity: number
    matchedFields: string[]
  }> = []
  
  for (const customer of customers) {
    const matchedFields: string[] = []
    let maxSimilarity = 0
    
    // Check company name similarity (80%+ threshold)
    const nameSimilarity = calculateSimilarity(companyName, customer.companyName)
    if (nameSimilarity >= 80) {
      matchedFields.push('companyName')
      maxSimilarity = Math.max(maxSimilarity, nameSimilarity)
    }
    
    // Check exact email match
    if (email && customer.email) {
      if (email.toLowerCase() === customer.email.toLowerCase()) {
        matchedFields.push('email')
        maxSimilarity = 100
      }
    }
    
    // Check exact phone match
    if (phone && customer.phone) {
      if (phone === customer.phone) {
        matchedFields.push('phone')
        maxSimilarity = 100
      }
    }
    
    if (matchedFields.length > 0) {
      duplicates.push({
        customer,
        similarity: maxSimilarity,
        matchedFields,
      })
    }
  }
  
  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity)
}
