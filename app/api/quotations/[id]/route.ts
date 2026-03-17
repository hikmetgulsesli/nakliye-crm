import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuotationStatus, TransportMode, Incoterm } from '@prisma/client';

// Validation schema for updating quotations
const quotationUpdateSchema = z.object({
  status: z.nativeEnum(QuotationStatus).optional(),
  originCity: z.string().min(1).max(100).optional(),
  originCountry: z.string().min(1).max(100).optional(),
  destinationCity: z.string().min(1).max(100).optional(),
  destinationCountry: z.string().min(1).max(100).optional(),
  transportMode: z.nativeEnum(TransportMode).optional(),
  incoterm: z.nativeEnum(Incoterm).optional().nullable(),
  cargoDescription: z.string().max(500).optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  volumeM3: z.number().positive().optional().nullable(),
  packagesCount: z.number().int().positive().optional().nullable(),
  freightCost: z.number().positive().optional().nullable(),
  originCharges: z.number().positive().optional().nullable(),
  destinationCharges: z.number().positive().optional().nullable(),
  insuranceCost: z.number().positive().optional().nullable(),
  totalCost: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  estimatedTransitDays: z.number().int().positive().optional().nullable(),
  internalNotes: z.string().max(1000).optional().nullable(),
});

// GET /api/quotations/[id] - Get a single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        activities: {
          include: {
            user: {
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
          take: 20,
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations/[id] - Update a quotation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = quotationUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (data.status !== undefined) updateData.status = data.status;
    if (data.originCity !== undefined) updateData.originCity = data.originCity;
    if (data.originCountry !== undefined) updateData.originCountry = data.originCountry;
    if (data.destinationCity !== undefined) updateData.destinationCity = data.destinationCity;
    if (data.destinationCountry !== undefined) updateData.destinationCountry = data.destinationCountry;
    if (data.transportMode !== undefined) updateData.transportMode = data.transportMode;
    if (data.incoterm !== undefined) updateData.incoterm = data.incoterm;
    if (data.cargoDescription !== undefined) updateData.cargoDescription = data.cargoDescription;
    if (data.weightKg !== undefined) {
      updateData.weightKg = data.weightKg ? BigInt(data.weightKg * 100) / BigInt(100) : null;
    }
    if (data.volumeM3 !== undefined) {
      updateData.volumeM3 = data.volumeM3 ? BigInt(data.volumeM3 * 100) / BigInt(100) : null;
    }
    if (data.packagesCount !== undefined) updateData.packagesCount = data.packagesCount;
    if (data.freightCost !== undefined) {
      updateData.freightCost = data.freightCost ? BigInt(data.freightCost * 100) / BigInt(100) : null;
    }
    if (data.originCharges !== undefined) {
      updateData.originCharges = data.originCharges ? BigInt(data.originCharges * 100) / BigInt(100) : null;
    }
    if (data.destinationCharges !== undefined) {
      updateData.destinationCharges = data.destinationCharges ? BigInt(data.destinationCharges * 100) / BigInt(100) : null;
    }
    if (data.insuranceCost !== undefined) {
      updateData.insuranceCost = data.insuranceCost ? BigInt(data.insuranceCost * 100) / BigInt(100) : null;
    }
    if (data.totalCost !== undefined) {
      updateData.totalCost = data.totalCost ? BigInt(data.totalCost * 100) / BigInt(100) : null;
    }
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.validUntil !== undefined) {
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    }
    if (data.estimatedTransitDays !== undefined) {
      updateData.estimatedTransitDays = data.estimatedTransitDays;
    }
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;

    // Update quotation
    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: quotation });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id] - Delete a quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete quotations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Delete quotation
    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Quotation deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}
