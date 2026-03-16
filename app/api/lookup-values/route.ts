import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Validation schema for creating/updating lookup values
const lookupValueSchema = z.object({
  category: z.string().min(1).max(50),
  value: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Helper function to check if user is admin
async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'ADMIN';
}

// GET /api/lookup-values - List all lookup values with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      where.category = category;
    }
    
    // Filter by active status
    const isActive = searchParams.get('isActive');
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    // Search by label or value
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { label: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    const lookupValues = await prisma.lookupValue.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { label: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: lookupValues });
  } catch (error) {
    console.error('Error fetching lookup values:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lookup values' },
      { status: 500 }
    );
  }
}

// POST /api/lookup-values - Create a new lookup value
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = lookupValueSchema.parse(body);
    
    // Check for duplicate value in the same category
    const existing = await prisma.lookupValue.findUnique({
      where: {
        category_value: {
          category: validatedData.category,
          value: validatedData.value,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A value with this key already exists in this category' },
        { status: 409 }
      );
    }
    
    const lookupValue = await prisma.lookupValue.create({
      data: validatedData,
    });

    return NextResponse.json(
      { success: true, data: lookupValue },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating lookup value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lookup value' },
      { status: 500 }
    );
  }
}
