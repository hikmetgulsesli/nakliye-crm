import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function for fuzzy string similarity
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 100
  
  const len1 = s1.length
  const len2 = s2.length
  const maxLen = Math.max(len1, len2)
  
  if (maxLen === 0) return 100
  
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

// GET /api/customers/check-duplicate - Check for potential duplicates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const companyName = searchParams.get('companyName')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
    const excludeId = searchParams.get('excludeId')
    
    if (!companyName && !phone && !email) {
      return NextResponse.json(
        { error: 'Must provide at least one parameter: companyName, phone, or email' },
        { status: 400 }
      )
    }
    
    const duplicates: Array<{
      customer: {
        id: string
        companyName: string
        email: string
        phone: string | null
        status: string
        createdAt: Date
      }
      similarity: number
      matchedFields: string[]
    }> = []
    
    // Get all customers for comparison
    const customers = await prisma.customer.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    })
    
    for (const customer of customers) {
      const matchedFields: string[] = []
      let maxSimilarity = 0
      
      // Check company name similarity (80%+ threshold)
      if (companyName) {
        const similarity = calculateSimilarity(companyName, customer.companyName)
        if (similarity >= 80) {
          matchedFields.push('companyName')
          maxSimilarity = Math.max(maxSimilarity, similarity)
        }
      }
      
      // Check exact phone match
      if (phone && customer.phone) {
        if (phone === customer.phone) {
          matchedFields.push('phone')
          maxSimilarity = 100
        }
      }
      
      // Check exact email match
      if (email && customer.email) {
        if (email.toLowerCase() === customer.email.toLowerCase()) {
          matchedFields.push('email')
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
    duplicates.sort((a, b) => b.similarity - a.similarity)
    
    return NextResponse.json({
      query: { companyName, phone, email, excludeId },
      isDuplicate: duplicates.length > 0,
      duplicates,
    })
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
}
