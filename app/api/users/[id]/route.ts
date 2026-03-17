import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Validation schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'OPERATIONS', 'FINANCE', 'VIEWER']).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/users/[id] - Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Get existing user for audit log
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email uniqueness if email is being updated (case-insensitive)
    if (validatedData.email) {
      const normalizedNewEmail = validatedData.email.toLowerCase()
      const normalizedOldEmail = existingUser.email.toLowerCase()
      
      if (normalizedNewEmail !== normalizedOldEmail) {
        const emailExists = await prisma.user.findFirst({
          where: { 
            email: { equals: normalizedNewEmail, mode: 'insensitive' },
          },
        });
        if (emailExists && emailExists.id !== id) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 409 }
          );
        }
      }
    }

    // Prevent self-deactivation via PATCH (consistent with DELETE)
    if (validatedData.isActive === false && id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    // Create audit log (exclude sensitive fields)
    const safeOldValues = {
      id: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
      phone: existingUser.phone,
      avatarUrl: existingUser.avatarUrl,
      isActive: existingUser.isActive,
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt,
    }
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'user',
        entityId: user.id,
        oldValues: safeOldValues,
        newValues: user,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Toggle user activation (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent deactivating yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Toggle activation status
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: user.isActive ? 'ACTIVATE' : 'DEACTIVATE',
        entityType: 'user',
        entityId: user.id,
        oldValues: { isActive: existingUser.isActive },
        newValues: { isActive: user.isActive },
      },
    });

    return NextResponse.json({
      message: user.isActive ? 'User activated' : 'User deactivated',
      user,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
