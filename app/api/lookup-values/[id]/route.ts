import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Validation schema for updating lookup values
const updateLookupValueSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// Helper function to check if user is admin
async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'ADMIN';
}

// GET /api/lookup-values/[id] - Get a single lookup value
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const lookupValue = await prisma.lookupValue.findUnique({
      where: { id },
    });

    if (!lookupValue) {
      return NextResponse.json(
        { success: false, error: 'Lookup value not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lookupValue });
  } catch (error) {
    console.error('Error fetching lookup value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lookup value' },
      { status: 500 }
    );
  }
}

// PATCH /api/lookup-values/[id] - Update a lookup value (supports activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = updateLookupValueSchema.parse(body);
    
    // Check if lookup value exists
    const existing = await prisma.lookupValue.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Lookup value not found' },
        { status: 404 }
      );
    }
    
    const lookupValue = await prisma.lookupValue.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: lookupValue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating lookup value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lookup value' },
      { status: 500 }
    );
  }
}

// DELETE /api/lookup-values/[id] - Delete a lookup value
// Note: In production, you might want to restrict this or use soft deletes
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Check if lookup value exists
    const existing = await prisma.lookupValue.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Lookup value not found' },
        { status: 404 }
      );
    }
    
    await prisma.lookupValue.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Lookup value deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting lookup value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lookup value' },
      { status: 500 }
    );
  }
}
