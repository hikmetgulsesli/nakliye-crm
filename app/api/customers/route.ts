import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, CustomerStatus } from '@prisma/client'
import { z } from 'zod'

// Validation schema for creating/updating customers
const customerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default('Türkiye'),
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLACKLISTED']).default('PROSPECT'),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})



// GET /api/customers - List all customers with search and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')
    // Validate pagination parameters
    const rawPage = searchParams.get('page')
    const rawLimit = searchParams.get('limit')
    const page = Math.max(1, parseInt(rawPage || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit || '20', 10)))
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: Prisma.CustomerWhereInput = {}
    
    // Validate status against enum
    if (status) {
      const validStatuses: CustomerStatus[] = ['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLACKLISTED']
      if (validStatuses.includes(status as CustomerStatus)) {
        where.status = status as CustomerStatus
      }
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Fetch customers
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              quotations: true,
              activities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])
    
    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = customerSchema.parse(body)
    
    // Check for duplicate email or phone in a single query
    if (validatedData.email || validatedData.phone) {
      const orConditions: Prisma.CustomerWhereInput[] = []
      
      if (validatedData.email) {
        orConditions.push({ email: { equals: validatedData.email, mode: 'insensitive' } })
      }
      if (validatedData.phone) {
        orConditions.push({ phone: validatedData.phone })
      }
      
      const existingCustomer = await prisma.customer.findFirst({
        where: { OR: orConditions },
      })
      
      if (existingCustomer) {
        const field = existingCustomer.email?.toLowerCase() === validatedData.email?.toLowerCase() 
          ? 'email' 
          : 'phone'
        return NextResponse.json(
          { error: `A customer with this ${field} already exists`, field },
          { status: 409 }
        )
      }
    }
    
    // Create customer
    const customer = await prisma.customer.create({
      data: validatedData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
    
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
