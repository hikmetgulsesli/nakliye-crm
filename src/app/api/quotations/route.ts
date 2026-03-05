import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  createQuotation, 
  getAllQuotations,
  updateCustomerLastQuoteDate
} from '@/lib/db/quotations';
import { getAllUsers } from '@/lib/db/users';
import { getAllCustomers } from '@/lib/db/customers';
import type { CreateQuotationInput } from '@/types';

const VALID_TRANSPORT_MODES = ['Deniz', 'Hava', 'Kara', 'Kombine'] as const;
const VALID_SERVICE_TYPES = ['FCL', 'LCL', 'Parsiyel', 'Komple', 'Bulk', 'RoRo'] as const;
const VALID_INCOTERMS = ['FOB', 'EXW', 'FCA', 'DAP', 'CIF', 'CFR', 'DDP'] as const;
const VALID_STATUSES = ['Bekliyor', 'Kazanildi', 'Kaybedildi'] as const;
const VALID_LOSS_REASONS = ['Fiyat', 'Rakip', 'Gecikmeli donus', 'Diger'] as const;
const VALID_CURRENCIES = ['USD', 'EUR', 'TRY'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') as typeof VALID_STATUSES[number] | undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      assigned_user_id: searchParams.get('assigned_user_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined)
    );

    const quotations = getAllQuotations(cleanFilters);
    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!body.customer_id?.trim()) {
      validationErrors.push('Müşteri seçimi zorunludur');
    }
    if (!body.quote_date?.trim()) {
      validationErrors.push('Teklif tarihi zorunludur');
    }
    if (!body.transport_mode) {
      validationErrors.push('Taşıma modu zorunludur');
    }
    if (!body.service_type) {
      validationErrors.push('Servis tipi zorunludur');
    }
    if (!body.origin_country?.trim()) {
      validationErrors.push('Çıkış ülkesi zorunludur');
    }
    if (!body.destination_country?.trim()) {
      validationErrors.push('Varış ülkesi zorunludur');
    }
    if (!body.incoterm) {
      validationErrors.push('Satış şekli (incoterm) zorunludur');
    }
    if (body.price === undefined || body.price === null) {
      validationErrors.push('Fiyat zorunludur');
    } else if (isNaN(body.price) || body.price < 0) {
      validationErrors.push('Geçerli bir fiyat giriniz');
    }
    if (!body.currency) {
      validationErrors.push('Para birimi zorunludur');
    }
    if (!body.assigned_user_id) {
      validationErrors.push('Atanan temsilci zorunludur');
    }

    // Validate status and loss_reason relationship
    if (body.status === 'Kaybedildi' && !body.loss_reason) {
      validationErrors.push('Kaybedilme nedeni seçilmelidir');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // Validate customer exists
    const customers = getAllCustomers();
    const customer = customers.find(c => c.id === body.customer_id);
    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid customer' },
        { status: 400 }
      );
    }

    // Validate assigned_user_id exists
    const users = getAllUsers();
    const assignedUser = users.find(u => u.id === body.assigned_user_id);
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Invalid assigned user' },
        { status: 400 }
      );
    }

    const input: CreateQuotationInput = {
      customer_id: body.customer_id.trim(),
      quote_date: body.quote_date.trim(),
      valid_until: body.valid_until?.trim() || null,
      transport_mode: VALID_TRANSPORT_MODES.includes(body.transport_mode) 
        ? body.transport_mode 
        : 'Deniz',
      service_type: VALID_SERVICE_TYPES.includes(body.service_type)
        ? body.service_type
        : 'FCL',
      origin_country: body.origin_country.trim(),
      destination_country: body.destination_country.trim(),
      pol: body.pol?.trim() || null,
      pod: body.pod?.trim() || null,
      incoterm: VALID_INCOTERMS.includes(body.incoterm)
        ? body.incoterm
        : 'FOB',
      price: Number(body.price),
      currency: VALID_CURRENCIES.includes(body.currency)
        ? body.currency
        : 'USD',
      price_note: body.price_note?.trim() || null,
      status: VALID_STATUSES.includes(body.status)
        ? body.status
        : 'Bekliyor',
      loss_reason: body.loss_reason && VALID_LOSS_REASONS.includes(body.loss_reason)
        ? body.loss_reason
        : null,
      assigned_user_id: body.assigned_user_id,
    };

    const quotation = createQuotation(input, session.user.id);
    
    // Update customer's last_quote_date
    updateCustomerLastQuoteDate(quotation.customer_id);

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}