import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuotationStatus, TransportMode, Incoterm } from '@prisma/client';

// Validation schema for creating/updating quotations
const quotationSchema = z.object({
  customerId: z.string().uuid(),
  originCity: z.string().min(1).max(100),
  originCountry: z.string().min(1).max(100),
  destinationCity: z.string().min(1).max(100),
  destinationCountry: z.string().min(1).max(100),
  transportMode: z.nativeEnum(TransportMode),
  incoterm: z.nativeEnum(Incoterm).optional(),
  cargoDescription: z.string().max(500).optional(),
  weightKg: z.number().positive().optional(),
  volumeM3: z.number().positive().optional(),
  packagesCount: z.number().int().positive().optional(),
  freightCost: z.number().positive().optional(),
  originCharges: z.number().positive().optional(),
  destinationCharges: z.number().positive().optional(),
  insuranceCost: z.number().positive().optional(),
  totalCost: z.number().positive().optional(),
  currency: z.string().default('USD'),
  validUntil: z.string().datetime().optional(),
  estimatedTransitDays: z.number().int().positive().optional(),
  internalNotes: z.string().max(1000).optional(),
});

// Generate unique quote number
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKF-${year}-`;
  
  // Find the last quotation for this year
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: 'desc',
    },
  });
  
  let nextNumber = 1;
  if (lastQuotation) {
    const lastNumber = parseInt(lastQuotation.quoteNumber.split('-')[2], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// GET /api/quotations - List all quotations with filtering
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
      where.status = status as QuotationStatus;
    }
    
    // Filter by customer
    const customerId = searchParams.get('customerId');
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Filter by transport mode
    const transportMode = searchParams.get('transportMode');
    if (transportMode) {
      where.transportMode = transportMode as TransportMode;
    }
    
    // Search by quote number or customer
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { originCity: { contains: search, mode: 'insensitive' } },
        { destinationCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: quotations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

// POST /api/quotations - Create a new quotation
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
    const validationResult = quotationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate unique quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        customerId: data.customerId,
        createdById: session.user.id,
        status: QuotationStatus.DRAFT,
        originCity: data.originCity,
        originCountry: data.originCountry,
        destinationCity: data.destinationCity,
        destinationCountry: data.destinationCountry,
        transportMode: data.transportMode,
        incoterm: data.incoterm,
        cargoDescription: data.cargoDescription,
        weightKg: data.weightKg ?? null,
        volumeM3: data.volumeM3 ?? null,
        packagesCount: data.packagesCount,
        freightCost: data.freightCost ?? null,
        originCharges: data.originCharges ?? null,
        destinationCharges: data.destinationCharges ?? null,
        insuranceCost: data.insuranceCost ?? null,
        totalCost: data.totalCost ?? null,
        currency: data.currency,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        estimatedTransitDays: data.estimatedTransitDays,
        internalNotes: data.internalNotes,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: quotation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
