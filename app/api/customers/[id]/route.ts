import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// Validation schema for updating customers
const customerUpdateSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'BLACKLISTED']).optional(),
  assignedToId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/customers/[id] - Get a single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            totalCost: true,
            currency: true,
            createdAt: true,
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            quotations: true,
            activities: true,
          },
        },
      },
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Validate input
    const validatedData = customerUpdateSchema.parse(body)
    
    // Check for duplicate email or phone if being updated - combined query for efficiency
    if ((validatedData.email && validatedData.email !== existingCustomer.email) || 
        (validatedData.phone && validatedData.phone !== existingCustomer.phone)) {
      const orConditions: Prisma.CustomerWhereInput[] = []
      
      if (validatedData.email && validatedData.email !== existingCustomer.email) {
        orConditions.push({ email: { equals: validatedData.email, mode: 'insensitive' } })
      }
      if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
        orConditions.push({ phone: validatedData.phone })
      }
      
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          id: { not: id },
          OR: orConditions,
        },
      })
      
      if (duplicateCustomer) {
        const field = duplicateCustomer.email?.toLowerCase() === validatedData.email?.toLowerCase()
          ? 'email'
          : 'phone'
        return NextResponse.json(
          { error: `A customer with this ${field} already exists`, field },
          { status: 409 }
        )
      }
    }
    
    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
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
        _count: {
          select: {
            quotations: true,
            activities: true,
          },
        },
      },
    })
    
    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quotations: true,
          },
        },
      },
    })
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion if customer has quotations
    if (existingCustomer._count.quotations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing quotations' },
        { status: 409 }
      )
    }
    
    // Delete customer
    await prisma.customer.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
