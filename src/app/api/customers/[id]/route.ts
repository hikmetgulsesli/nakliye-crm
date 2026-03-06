import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getCustomerById, updateCustomer, deleteCustomer, getCustomerByIdWithUser, checkConflicts } from '@/lib/db/customers';
import { getAllUsers } from '@/lib/db/users';
import type { UpdateCustomerInput } from '@/types';

const VALID_TRANSPORT_MODES = ['Deniz', 'Hava', 'Kara', 'Kombine'] as const;
const VALID_SERVICE_TYPES = ['FCL', 'LCL', 'Parsiyel', 'Komple', 'Bulk', 'RoRo'] as const;
const VALID_INCOTERMS = ['FOB', 'EXW', 'FCA', 'DAP', 'CIF', 'CFR', 'DDP'] as const;
const VALID_DIRECTIONS = ['Ithalat', 'Ihracat'] as const;
const VALID_SOURCES = ['Referans', 'Soguk arama', 'Fuar', 'Dijital'] as const;
const VALID_POTENTIALS = ['Dusuk', 'Orta', 'Yuksek'] as const;
const VALID_STATUSES = ['Aktif', 'Pasif', 'Soguk'] as const;

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const customer = getCustomerByIdWithUser(id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existingCustomer = getCustomerById(id);
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Check for conflicts if company_name, phone, or email is being changed
    const companyName = body.company_name !== undefined ? body.company_name : existingCustomer.company_name;
    const phone = body.phone !== undefined ? body.phone : existingCustomer.phone;
    const email = body.email !== undefined ? body.email : existingCustomer.email;
    
    const conflicts = checkConflicts(companyName, phone, email, id);
    
    // If conflicts exist and force is not set, return conflicts
    if (conflicts.length > 0 && !body.force) {
      return NextResponse.json(
        { 
          error: 'Potential conflicts detected',
          conflicts,
          requiresConfirmation: true
        },
        { status: 409 }
      );
    }

    // Validate assigned_user_id if provided
    if (body.assigned_user_id) {
      const users = getAllUsers();
      const assignedUser = users.find(u => u.id === body.assigned_user_id);
      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Invalid assigned user' },
          { status: 400 }
        );
      }
    }

    const input: UpdateCustomerInput = {};

    if (body.company_name !== undefined) {
      input.company_name = body.company_name.trim();
    }
    if (body.contact_name !== undefined) {
      input.contact_name = body.contact_name.trim();
    }
    if (body.phone !== undefined) {
      input.phone = body.phone.trim();
    }
    if (body.email !== undefined) {
      input.email = body.email.trim().toLowerCase();
    }
    if (body.address !== undefined) {
      input.address = body.address?.trim() || undefined;
    }
    if (body.transport_modes !== undefined) {
      input.transport_modes = body.transport_modes.filter((m: string) => VALID_TRANSPORT_MODES.includes(m as typeof VALID_TRANSPORT_MODES[number]));
    }
    if (body.service_types !== undefined) {
      input.service_types = body.service_types.filter((t: string) => VALID_SERVICE_TYPES.includes(t as typeof VALID_SERVICE_TYPES[number]));
    }
    if (body.incoterms !== undefined) {
      input.incoterms = body.incoterms.filter((i: string) => VALID_INCOTERMS.includes(i as typeof VALID_INCOTERMS[number]));
    }
    if (body.direction !== undefined) {
      input.direction = body.direction.filter((d: string) => VALID_DIRECTIONS.includes(d as typeof VALID_DIRECTIONS[number]));
    }
    if (body.origin_countries !== undefined) {
      input.origin_countries = body.origin_countries;
    }
    if (body.destination_countries !== undefined) {
      input.destination_countries = body.destination_countries;
    }
    if (body.source !== undefined && VALID_SOURCES.includes(body.source)) {
      input.source = body.source;
    }
    if (body.potential !== undefined && VALID_POTENTIALS.includes(body.potential)) {
      input.potential = body.potential;
    }
    if (body.status !== undefined && VALID_STATUSES.includes(body.status)) {
      input.status = body.status;
    }
    if (body.assigned_user_id !== undefined) {
      input.assigned_user_id = body.assigned_user_id;
    }
    if (body.notes !== undefined) {
      input.notes = body.notes?.trim() || undefined;
    }

    const customer = updateCustomer(id, input);

    if (!customer) {
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete customers
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const existingCustomer = getCustomerById(id);
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const success = deleteCustomer(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
