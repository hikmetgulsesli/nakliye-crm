import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getSession } from '@/lib/auth/session';
=======
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/index';
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
import { findConflicts, forceCreateCustomer } from '@/lib/services/customer';
import { conflictCheckSchema, customerSchema, type CustomerInput } from '@/lib/validators/customer';

function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

// GET /api/conflicts/check - Check for conflicts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const validation = conflictCheckSchema.safeParse(rawParams);
    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid conflict check parameters',
        400,
        validation.error.issues
      );
    }

    const { exclude_id, ...checkData } = validation.data;
    const conflicts = await findConflicts(checkData, exclude_id);

    return NextResponse.json({
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to check conflicts', 500);
  }
}

// POST /api/conflicts/force-create - Force create a customer despite conflicts (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
<<<<<<< HEAD
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Only admins can force create customers
    if (session.user.role !== 'admin') {
=======
    // Check admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }

    const body = await request.json();
    const { force, ...customerData } = body;

    if (!force) {
      return errorResponse(
        'INVALID_REQUEST',
        'Force flag is required for forced creation',
        400
      );
    }

    const validation = customerSchema.safeParse(customerData);
    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid customer data',
        400,
        validation.error.issues
      );
    }

    const data = validation.data as CustomerInput;
<<<<<<< HEAD
    const createdBy = session.user.id ? parseInt(session.user.id, 10) : null;
=======
    const createdBy = session.user.id;
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

    const customer = await forceCreateCustomer(data, createdBy);
    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('Error force creating customer:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create customer', 500);
  }
}
