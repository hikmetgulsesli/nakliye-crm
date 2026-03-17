import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { calculateSimilarity } from '@/lib/services/customerService'

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
    
    // First, check exact matches on phone and email using DB queries (efficient)
    const orConditions: Prisma.CustomerWhereInput = {}
    
    if (email || phone) {
      orConditions.OR = []
      if (email) {
        orConditions.OR.push({ email: { equals: email, mode: 'insensitive' } })
      }
      if (phone) {
        orConditions.OR.push({ phone })
      }
      if (excludeId) {
        orConditions.id = { not: excludeId }
      }
      
      const exactMatches = await prisma.customer.findMany({
        where: orConditions,
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      })
      
      for (const customer of exactMatches) {
        const matchedFields: string[] = []
        if (email && customer.email && email.toLowerCase() === customer.email.toLowerCase()) {
          matchedFields.push('email')
        }
        if (phone && customer.phone && phone === customer.phone) {
          matchedFields.push('phone')
        }
        if (matchedFields.length > 0) {
          duplicates.push({
            customer,
            similarity: 100,
            matchedFields,
          })
        }
      }
    }
    
    // Then, check fuzzy name matching (only if companyName provided)
    // Use DB contains filter to reduce candidates, then do fuzzy matching in memory
    if (companyName) {
      const searchPrefix = companyName.substring(0, 3).toLowerCase()
      
      const potentialNameMatches = await prisma.customer.findMany({
        where: {
          companyName: {
            contains: searchPrefix,
            mode: 'insensitive',
          },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
        take: 100,
      })
      
      for (const customer of potentialNameMatches) {
        const similarity = calculateSimilarity(companyName, customer.companyName)
        if (similarity >= 80) {
          // Check if this customer is already in duplicates
          const existingIndex = duplicates.findIndex(d => d.customer.id === customer.id)
          if (existingIndex >= 0) {
            // Add companyName to matched fields
            duplicates[existingIndex].matchedFields.push('companyName')
            duplicates[existingIndex].similarity = 100
          } else {
            duplicates.push({
              customer,
              similarity,
              matchedFields: ['companyName'],
            })
          }
        }
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
