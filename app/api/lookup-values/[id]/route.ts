import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (session?.user?.role !== 'ADMIN') {
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
    
    // Build update data and track changes
    const updateData: { label?: string; description?: string | null; sortOrder?: number; isActive?: boolean } = {};
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};

    if (validatedData.label !== undefined && validatedData.label !== existing.label) {
      changedFields.label = { old: existing.label, new: validatedData.label };
      updateData.label = validatedData.label;
    }
    if (validatedData.description !== undefined && validatedData.description !== existing.description) {
      changedFields.description = { old: existing.description, new: validatedData.description };
      updateData.description = validatedData.description;
    }
    if (validatedData.sortOrder !== undefined && validatedData.sortOrder !== existing.sortOrder) {
      changedFields.sortOrder = { old: existing.sortOrder, new: validatedData.sortOrder };
      updateData.sortOrder = validatedData.sortOrder;
    }
    if (validatedData.isActive !== undefined && validatedData.isActive !== existing.isActive) {
      changedFields.isActive = { old: existing.isActive, new: validatedData.isActive };
      updateData.isActive = validatedData.isActive;
    }
    
    // Update lookup value and create audit log in a transaction
    const lookupValue = await prisma.$transaction(async (tx) => {
      const updated = Object.keys(updateData).length > 0
        ? await tx.lookupValue.update({
            where: { id },
            data: updateData,
          })
        : existing;

      // Create audit log if there are changes
      if (Object.keys(changedFields).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE',
            entityType: 'lookup_value',
            entityId: id,
            oldValues: changedFields as Prisma.InputJsonValue,
            newValues: updateData as Prisma.InputJsonValue,
          },
        });
      }

      return updated;
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
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (session?.user?.role !== 'ADMIN') {
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
    
    // Delete lookup value and create audit log in a transaction
    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETE',
          entityType: 'lookup_value',
          entityId: id,
          oldValues: existing as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.lookupValue.delete({
        where: { id },
      });
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
