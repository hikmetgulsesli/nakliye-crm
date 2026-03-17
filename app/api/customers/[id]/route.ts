import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Validation schema for updating a customer
const updateCustomerSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  // Additional CRM fields
  transportModes: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  incoterms: z.array(z.string()).optional(),
  direction: z.enum(['IMPORT', 'EXPORT', 'BOTH']).optional(),
  originCountries: z.array(z.string()).optional(),
  destinationCountries: z.array(z.string()).optional(),
  source: z.string().optional(),
  potential: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
  assignedToId: z.string().uuid().optional(),
});

// GET /api/customers/[id] - Get a single customer by ID
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
        // Include recent quotations
        quotations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            totalCost: true,
            currency: true,
            createdAt: true,
          },
        },
        // Include recent activities
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update a customer
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
    
    // Validate input
    const validatedData = updateCustomerSchema.parse(body);
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check permissions (admin can edit any, users can only edit their own)
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can edit customers' },
        { status: 403 }
      );
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
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete a customer
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
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can delete customers' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Delete customer (this will cascade to related quotations and activities)
    await prisma.customer.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
