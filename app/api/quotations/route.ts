import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Validation schema for creating a quotation
const createQuotationSchema = z.object({
  customerId: z.string().uuid(),
  originCity: z.string().min(1).max(100),
  originCountry: z.string().min(1).max(100),
  destinationCity: z.string().min(1).max(100),
  destinationCountry: z.string().min(1).max(100),
  transportMode: z.enum(['AIR', 'SEA', 'ROAD', 'RAIL', 'MULTIMODAL']),
  serviceType: z.string().optional(),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']).optional(),
  freightCost: z.number().positive().optional(),
  originCharges: z.number().optional(),
  destinationCharges: z.number().optional(),
  insuranceCost: z.number().optional(),
  totalCost: z.number().optional(),
  currency: z.string().length(3).default('USD'),
  validUntil: z.string().optional(),
  internalNotes: z.string().optional(),
  cargoDescription: z.string().optional(),
  weightKg: z.number().optional(),
  volumeM3: z.number().optional(),
  packagesCount: z.number().optional(),
  estimatedTransitDays: z.number().optional(),
});

// Helper function to generate quote number
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKF-${year}-`;
  
  // Get the last quotation number for this year
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quoteNumber: { startsWith: prefix },
    },
    orderBy: { quoteNumber: 'desc' },
  });
  
  let nextNumber = 1;
  if (lastQuotation) {
    const lastNumber = parseInt(lastQuotation.quoteNumber.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

// GET /api/quotations - List quotations with filtering
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
    
    // Search by quote number or customer name
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      where.status = status;
    }
    
    // Filter by transport mode
    const transportMode = searchParams.get('transportMode');
    if (transportMode) {
      where.transportMode = transportMode;
    }
    
    // Filter by customer ID
    const customerId = searchParams.get('customerId');
    if (customerId) {
      where.customerId = customerId;
    }
    
    // Date range filters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }
    
    // Get total count
    const total = await prisma.quotation.count({ where });
    
    // Get quotations with related data
    const quotations = await prisma.quotation.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
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
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createQuotationSchema.parse(body);
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber();
    
    // Calculate total cost if not provided
    let totalCost = validatedData.totalCost;
    if (!totalCost && validatedData.freightCost) {
      totalCost = 
        (validatedData.freightCost || 0) +
        (validatedData.originCharges || 0) +
        (validatedData.destinationCharges || 0) +
        (validatedData.insuranceCost || 0);
    }
    
    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        customerId: validatedData.customerId,
        createdById: session.user.id,
        originCity: validatedData.originCity,
        originCountry: validatedData.originCountry,
        destinationCity: validatedData.destinationCity,
        destinationCountry: validatedData.destinationCountry,
        transportMode: validatedData.transportMode,
        incoterm: validatedData.incoterm,
        freightCost: validatedData.freightCost,
        originCharges: validatedData.originCharges,
        destinationCharges: validatedData.destinationCharges,
        insuranceCost: validatedData.insuranceCost,
        totalCost: totalCost,
        currency: validatedData.currency,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        internalNotes: validatedData.internalNotes,
        cargoDescription: validatedData.cargoDescription,
        weightKg: validatedData.weightKg,
        volumeM3: validatedData.volumeM3,
        packagesCount: validatedData.packagesCount,
        estimatedTransitDays: validatedData.estimatedTransitDays,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
