import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '@/lib/services/customer';
import { customerUpdateSchema, type CustomerUpdateInput } from '@/lib/validators/customer';

function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

function successResponse(data: unknown) {
  return NextResponse.json({ data });
}

// GET /api/customers/[id] - Get a single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return errorResponse('INVALID_ID', 'Invalid customer ID', 400);
    }

    const customer = await getCustomerById(customerId);

    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch customer', 500);
  }
}

// PATCH /api/customers/[id] - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return errorResponse('INVALID_ID', 'Invalid customer ID', 400);
    }

    const body = await request.json();
    const validation = customerUpdateSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid customer data',
        400,
        validation.error.issues
      );
    }

    const data = validation.data as CustomerUpdateInput;
    const updatedBy = null; // TODO: Get from auth session

    const customer = await updateCustomer(customerId, data, updatedBy);

    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to update customer', 500);
  }
}

// DELETE /api/customers/[id] - Soft delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);

    if (isNaN(customerId)) {
      return errorResponse('INVALID_ID', 'Invalid customer ID', 400);
    }

    const deletedBy = null; // TODO: Get from auth session
    const customer = await deleteCustomer(customerId, deletedBy);

    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found', 404);
    }

    return successResponse(customer);
  } catch (error) {
    console.error('Error deleting customer:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to delete customer', 500);
  }
}
