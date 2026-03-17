import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Validate pagination parameters
function getValidatedPagination(pageParam: string | null, limitParam: string | null): { page: number; limit: number; isValid: boolean } {
  const page = parseInt(pageParam || '1', 10);
  const limit = parseInt(limitParam || '10', 10);
  
  if (isNaN(page) || page < 1) {
    return { page: 1, limit: 10, isValid: false };
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return { page, limit: Math.min(100, Math.max(1, limit)), isValid: false };
  }
  return { page, limit, isValid: true };
}

// GET /api/audit-logs - Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin-only access
    if (!session?.user || (session.user as { role?: string }).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userSearch = searchParams.get('userSearch');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Validate pagination
    const { page, limit, isValid } = getValidatedPagination(pageParam, limitParam);
    if (!isValid) {
      // Still process but with corrected values
    }

    // Build where clause
    const where: {
      userId?: string;
      action?: string;
      entityType?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      user?: {
        OR?: Array<{
          email?: { contains: string; mode: 'insensitive' };
          firstName?: { contains: string; mode: 'insensitive' };
          lastName?: { contains: string; mode: 'insensitive' };
        }>;
      };
    } = {};

    if (userId && userId !== 'all') {
      where.userId = userId;
    }

    if (action && action !== 'all') {
      where.action = action.toUpperCase();
    }

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }

    // Server-side user search
    if (userSearch && userSearch.trim()) {
      const searchTerm = userSearch.trim();
      where.user = {
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // dateTo is already end of day from client, so just use it directly
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch audit logs with user info
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
