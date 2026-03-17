import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomerStatus } from '@prisma/client';

// Validation schema for creating/updating customers
const customerSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('Türkiye'),
  postalCode: z.string().max(20).optional().nullable(),
  taxNumber: z.string().max(50).optional().nullable(),
  taxOffice: z.string().max(100).optional().nullable(),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.PROSPECT),
  assignedToId: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// GET /api/customers - List all customers with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      where.status = status as CustomerStatus;
    }
    
    // Filter by assigned user
    const assignedToId = searchParams.get('assignedToId');
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    
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

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

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
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = customerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for duplicate email
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: data.email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'A customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        taxNumber: data.taxNumber,
        taxOffice: data.taxOffice,
        status: data.status,
        assignedToId: data.assignedToId,
        notes: data.notes,
      },
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
    });

    return NextResponse.json(
      { success: true, data: customer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
