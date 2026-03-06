import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getSession } from '@/lib/auth/session';
import { createCustomer, getAllCustomers, checkConflicts } from '@/lib/db/customers';
import { getAllUsers } from '@/lib/db/users';
import type { CreateCustomerInput } from '@/types';
=======
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/index';
import {
  getCustomers,
  createCustomer,
} from '@/lib/services/customer';
import { customerSchema, customerFilterSchema, type CustomerInput } from '@/lib/validators/customer';
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

const VALID_TRANSPORT_MODES = ['Deniz', 'Hava', 'Kara', 'Kombine'] as const;
const VALID_SERVICE_TYPES = ['FCL', 'LCL', 'Parsiyel', 'Komple', 'Bulk', 'RoRo'] as const;
const VALID_INCOTERMS = ['FOB', 'EXW', 'FCA', 'DAP', 'CIF', 'CFR', 'DDP'] as const;
const VALID_DIRECTIONS = ['Ithalat', 'Ihracat'] as const;
const VALID_SOURCES = ['Referans', 'Soguk arama', 'Fuar', 'Dijital'] as const;
const VALID_POTENTIALS = ['Dusuk', 'Orta', 'Yuksek'] as const;
const VALID_STATUSES = ['Aktif', 'Pasif', 'Soguk'] as const;

export async function GET() {
  try {
<<<<<<< HEAD
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
=======
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
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
    }

    const customers = getAllCustomers();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
=======
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const validation = customerSchema.safeParse(body);
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

    const body = await request.json();
    
    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!body.company_name?.trim()) {
      validationErrors.push('Firma adı zorunludur');
    }
    if (!body.contact_name?.trim()) {
      validationErrors.push('Yetkili adı zorunludur');
    }
    if (!body.phone?.trim()) {
      validationErrors.push('Telefon zorunludur');
    }
    if (!body.email?.trim()) {
      validationErrors.push('E-posta zorunludur');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      validationErrors.push('Geçerli bir e-posta adresi giriniz');
    }
    if (!body.assigned_user_id) {
      validationErrors.push('Atanan temsilci zorunludur');
    }

    // Validate array fields
    if (!body.transport_modes?.length) {
      validationErrors.push('En az bir taşıma modu seçilmelidir');
    }
    if (!body.service_types?.length) {
      validationErrors.push('En az bir servis tipi seçilmelidir');
    }
    if (!body.incoterms?.length) {
      validationErrors.push('En az bir satış şekli seçilmelidir');
    }
    if (!body.direction?.length) {
      validationErrors.push('En az bir işlem yönü seçilmelidir');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Check for conflicts
    const conflicts = checkConflicts(body.company_name, body.phone, body.email);
    
    // If conflicts exist and force is not set, return conflicts (only admin can force)
    if (conflicts.length > 0 && !(body.force && session.user.role === 'admin')) {
      return NextResponse.json(
        { 
          error: 'Potential conflicts detected',
          conflicts,
          requiresConfirmation: true
        },
        { status: 409 }
      );
    }
=======
    const data = validation.data as CustomerInput;
    const createdBy = session.user.id;
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

    // Validate assigned_user_id exists
    const users = getAllUsers();
    const assignedUser = users.find(u => u.id === body.assigned_user_id);
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Invalid assigned user' },
        { status: 400 }
      );
    }

    const input: CreateCustomerInput = {
      company_name: body.company_name.trim(),
      contact_name: body.contact_name.trim(),
      phone: body.phone.trim(),
      email: body.email.trim().toLowerCase(),
      address: body.address?.trim() || undefined,
      transport_modes: body.transport_modes.filter((m: string) => VALID_TRANSPORT_MODES.includes(m as typeof VALID_TRANSPORT_MODES[number])),
      service_types: body.service_types.filter((t: string) => VALID_SERVICE_TYPES.includes(t as typeof VALID_SERVICE_TYPES[number])),
      incoterms: body.incoterms.filter((i: string) => VALID_INCOTERMS.includes(i as typeof VALID_INCOTERMS[number])),
      direction: body.direction.filter((d: string) => VALID_DIRECTIONS.includes(d as typeof VALID_DIRECTIONS[number])),
      origin_countries: body.origin_countries || [],
      destination_countries: body.destination_countries || [],
      source: VALID_SOURCES.includes(body.source) ? body.source : 'Dijital',
      potential: VALID_POTENTIALS.includes(body.potential) ? body.potential : 'Orta',
      status: VALID_STATUSES.includes(body.status) ? body.status : 'Aktif',
      assigned_user_id: body.assigned_user_id,
      notes: body.notes?.trim() || undefined,
    };

    const customer = createCustomer(input, session.user.id);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
