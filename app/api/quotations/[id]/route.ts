import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';

// Validation schema for updating a quotation
const updateQuotationSchema = z.object({
  originCity: z.string().min(1).max(100).optional(),
  originCountry: z.string().min(1).max(100).optional(),
  destinationCity: z.string().min(1).max(100).optional(),
  destinationCountry: z.string().min(1).max(100).optional(),
  transportMode: z.enum(['AIR', 'SEA', 'ROAD', 'RAIL', 'MULTIMODAL']).optional(),
  serviceType: z.string().optional(),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']).optional(),
  freightCost: z.number().positive().optional(),
  originCharges: z.number().optional(),
  destinationCharges: z.number().optional(),
  insuranceCost: z.number().optional(),
  totalCost: z.number().optional(),
  currency: z.string().length(3).optional(),
  validUntil: z.string().optional(),
  internalNotes: z.string().optional(),
  cargoDescription: z.string().optional(),
  weightKg: z.number().optional(),
  volumeM3: z.number().optional(),
  packagesCount: z.number().optional(),
  estimatedTransitDays: z.number().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED']).optional(),
});

// Status update schema (lighter weight for status-only updates)
const statusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED']),
});

// GET /api/quotations/[id] - Get a single quotation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
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
          },
        },
      },
    });
    
    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: quotation,
    });
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
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    
    // Check if this is a status-only update
    const isStatusUpdate = body.status && !body.originCity && !body.freightCost;
    
    // Validate input
    const validatedData = isStatusUpdate 
      ? statusUpdateSchema.parse(body)
      : updateQuotationSchema.parse(body);
    
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
    
    // Build update data - separate handling for status-only vs full updates
    let updateData: any;
    
    if (isStatusUpdate) {
      // Status-only update
      updateData = { status: (validatedData as any).status };
    } else {
      // Full update
      const data = validatedData as any;
      updateData = {
        originCity: data.originCity,
        originCountry: data.originCountry,
        destinationCity: data.destinationCity,
        destinationCountry: data.destinationCountry,
        transportMode: data.transportMode,
        serviceType: data.serviceType,
        incoterm: data.incoterm,
        freightCost: data.freightCost,
        originCharges: data.originCharges,
        destinationCharges: data.destinationCharges,
        insuranceCost: data.insuranceCost,
        totalCost: data.totalCost,
        currency: data.currency,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        internalNotes: data.internalNotes,
        cargoDescription: data.cargoDescription,
        weightKg: data.weightKg,
        volumeM3: data.volumeM3,
        packagesCount: data.packagesCount,
        estimatedTransitDays: data.estimatedTransitDays,
        status: data.status,
      };
    }
    
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
            email: true,
            phone: true,
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
    
    return NextResponse.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
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
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const isAdmin = session.user.role === 'ADMIN';
    
    const { id } = await params;
    
    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        createdBy: true,
      },
    });
    
    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Only allow deletion by admin or the creator
    if (!isAdmin && existingQuotation.createdById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only delete your own quotations' },
        { status: 403 }
      );
    }
    
    await prisma.quotation.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}
