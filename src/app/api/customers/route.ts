import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/index';
import {
  getCustomers,
  createCustomer,
} from '@/lib/services/customer';
import { customerSchema, customerFilterSchema, type CustomerInput } from '@/lib/validators/customer';

function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta });
}

// GET /api/customers - List customers with filters
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    const validation = customerFilterSchema.safeParse(rawParams);
    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid filter parameters',
        400,
        validation.error.issues
      );
    }

    const filters = validation.data;
    const { customers, total } = await getCustomers(filters);

    return successResponse(customers, {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch customers', 500);
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validation = customerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid customer data',
        400,
        validation.error.issues
      );
    }

    const data = validation.data as CustomerInput;
    const createdBy = parseInt(session.user.id, 10);

    const customer = await createCustomer(data, createdBy);
    return successResponse(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    if ((error as Error).message?.includes('unique constraint')) {
      return errorResponse('CONFLICT', 'Customer with this information already exists', 409);
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to create customer', 500);
  }
}
