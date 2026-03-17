import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function for fuzzy string similarity (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
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

// GET /api/customers/search - Search customers with fuzzy matching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const companyName = searchParams.get('companyName')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
    const minSimilarity = parseInt(searchParams.get('minSimilarity') || '80', 10)
    
    // Must provide at least one search parameter
    if (!companyName && !phone && !email) {
      return NextResponse.json(
        { error: 'Must provide at least one search parameter: companyName, phone, or email' },
        { status: 400 }
      )
    }
    
    const results: Array<{
      customer: {
        id: string
        companyName: string
        email: string
        phone: string | null
        status: string
      }
      similarity: number
      matchType: 'companyName' | 'phone' | 'email'
    }> = []
    
    // Search by company name (fuzzy match)
    if (companyName) {
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
        },
      })
      
      for (const customer of customers) {
        const similarity = calculateSimilarity(companyName, customer.companyName)
        if (similarity >= minSimilarity) {
          results.push({
            customer,
            similarity,
            matchType: 'companyName',
          })
        }
      }
    }
    
    // Search by phone (exact match)
    if (phone) {
      const phoneCustomers = await prisma.customer.findMany({
        where: { phone },
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
        },
      })
      
      for (const customer of phoneCustomers) {
        // Check if not already added by company name search
        const existingIndex = results.findIndex(r => r.customer.id === customer.id)
        if (existingIndex === -1) {
          results.push({
            customer,
            similarity: 100,
            matchType: 'phone',
          })
        }
      }
    }
    
    // Search by email (exact match)
    if (email) {
      const emailCustomers = await prisma.customer.findMany({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
        },
      })
      
      for (const customer of emailCustomers) {
        // Check if not already added
        const existingIndex = results.findIndex(r => r.customer.id === customer.id)
        if (existingIndex === -1) {
          results.push({
            customer,
            similarity: 100,
            matchType: 'email',
          })
        }
      }
    }
    
    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity)
    
    return NextResponse.json({
      query: { companyName, phone, email, minSimilarity },
      results,
      totalCount: results.length,
    })
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}
