import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/lookup-values/categories - Get all unique categories
export async function GET() {
  try {
    const categories = await prisma.lookupValue.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    // Extract just the category names
    const categoryList = categories.map((c: { category: string }) => c.category);

    return NextResponse.json({ 
      success: true, 
      data: categoryList 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
