import { NextRequest, NextResponse } from 'next/server';
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
    const createdBy = null; // TODO: Get from auth session

    const customer = await forceCreateCustomer(data, createdBy);
    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('Error force creating customer:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to create customer', 500);
  }
}
