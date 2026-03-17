import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateSimilarity } from '@/lib/services/customerService'

// GET /api/customers/search - Search customers with fuzzy matching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const companyName = searchParams.get('companyName')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
    // Validate and clamp minSimilarity to 0-100 range
    const rawMinSimilarity = searchParams.get('minSimilarity')
    let minSimilarity = 80
    if (rawMinSimilarity) {
      const parsed = parseInt(rawMinSimilarity, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        minSimilarity = parsed
      }
    }
    
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
      // Use database contains filter as pre-filter to reduce rows for fuzzy matching
      // Get first 3 characters for initial filtering (common prefix approach)
      const searchPrefix = companyName.substring(0, 3).toLowerCase()
      
      const customers = await prisma.customer.findMany({
        where: {
          companyName: {
            contains: searchPrefix,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
        },
        // Limit to prevent excessive memory usage
        take: 100,
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
