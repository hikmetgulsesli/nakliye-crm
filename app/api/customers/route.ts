import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Validation schema for creating a customer
const createCustomerSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/customers - List customers with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Search by company name, contact name, email, or phone
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      where.status = status;
    }
    
    // Filter by potential
    const potential = searchParams.get('potential');
    if (potential) {
      where.potential = potential;
    }
    
    // Filter by source
    const source = searchParams.get('source');
    if (source) {
      where.source = source;
    }
    
    // Get total count
    const total = await prisma.customer.count({ where });
    
    // Get customers
    const customers = await prisma.customer.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createCustomerSchema.parse(body);
    
    // Check for duplicate company name (fuzzy match warning would be handled client-side)
    // For now, just create the customer
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        companyName: validatedData.companyName,
        contactName: validatedData.contactName || null,
        email: validatedData.email || '',
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        // CRM fields
        notes: validatedData.notes || null,
        // Assign to current user by default
        assignedToId: session.user.id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: customer },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
