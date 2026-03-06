import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  createQuotation, 
  getQuotations,
  getQuotationByIdWithCustomer 
} from '@/lib/db/quotations';
import { updateCustomerLastQuoteDate } from '@/lib/db/customers';
import type { CreateQuotationInput, QuoteStatus, LossReason, Currency } from '@/types';

const VALID_STATUSES: QuoteStatus[] = ['Bekliyor', 'Kazanildi', 'Kaybedildi'];
const VALID_LOSS_REASONS: LossReason[] = ['Fiyat', 'Rakip', 'Gecikmeli donus', 'Diger'];
const VALID_CURRENCIES: Currency[] = ['USD', 'EUR', 'TRY'];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters = {
      status: searchParams.get('status') as QuoteStatus | undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      assigned_user_id: searchParams.get('assigned_user_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      include_deleted: searchParams.get('include_deleted') === 'true',
    };

    // Validate status if provided
    if (filters.status && !VALID_STATUSES.includes(filters.status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    const quotations = getQuotations(filters);
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
    const validationErrors: Array<{ field: string; message: string }> = [];
    
    if (!body.customer_id?.trim()) {
      validationErrors.push({ field: 'customer_id', message: 'Müşteri zorunludur' });
    }
    if (!body.quote_date?.trim()) {
      validationErrors.push({ field: 'quote_date', message: 'Teklif tarihi zorunludur' });
    } else if (!isValidDate(body.quote_date)) {
      validationErrors.push({ field: 'quote_date', message: 'Geçerli bir tarih giriniz' });
    }
    if (!body.transport_mode?.trim()) {
      validationErrors.push({ field: 'transport_mode', message: 'Taşıma modu zorunludur' });
    }
    if (!body.service_type?.trim()) {
      validationErrors.push({ field: 'service_type', message: 'Servis tipi zorunludur' });
    }
    if (!body.origin_country?.trim()) {
      validationErrors.push({ field: 'origin_country', message: 'Çıkış ülkesi zorunludur' });
    }
    if (!body.destination_country?.trim()) {
      validationErrors.push({ field: 'destination_country', message: 'Varış ülkesi zorunludur' });
    }
    if (!body.incoterm?.trim()) {
      validationErrors.push({ field: 'incoterm', message: 'Incoterm zorunludur' });
    }
    if (!body.assigned_user_id?.trim()) {
      validationErrors.push({ field: 'assigned_user_id', message: 'Atanan temsilci zorunludur' });
    }

    // Validate optional fields if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      validationErrors.push({ field: 'status', message: 'Geçersiz durum değeri' });
    }
    if (body.loss_reason && !VALID_LOSS_REASONS.includes(body.loss_reason)) {
      validationErrors.push({ field: 'loss_reason', message: 'Geçersiz kaybetme nedeni' });
    }
    if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
      validationErrors.push({ field: 'currency', message: 'Geçersiz para birimi' });
    }
    if (body.price !== undefined && body.price !== null) {
      if (typeof body.price !== 'number' || body.price < 0) {
        validationErrors.push({ field: 'price', message: 'Fiyat pozitif bir sayı olmalıdır' });
      }
      if (!body.currency) {
        validationErrors.push({ field: 'currency', message: 'Fiyat girildiğinde para birimi zorunludur' });
      }
    }
    if (body.validity_date && !isValidDate(body.validity_date)) {
      validationErrors.push({ field: 'validity_date', message: 'Geçerli bir tarih giriniz' });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    const input: CreateQuotationInput = {
      customer_id: body.customer_id.trim(),
      quote_date: body.quote_date.trim(),
      validity_date: body.validity_date?.trim() || null,
      transport_mode: body.transport_mode.trim(),
      service_type: body.service_type.trim(),
      origin_country: body.origin_country.trim(),
      destination_country: body.destination_country.trim(),
      pol: body.pol?.trim() || null,
      pod: body.pod?.trim() || null,
      incoterm: body.incoterm.trim(),
      price: body.price ?? null,
      currency: body.currency || null,
      price_note: body.price_note?.trim() || null,
      status: body.status || 'Bekliyor',
      loss_reason: body.loss_reason || null,
      assigned_user_id: body.assigned_user_id.trim(),
    };

    const quotation = createQuotation(input, session.user.id);

    // Auto-update customer's last_quote_date
    try {
      updateCustomerLastQuoteDate(quotation.customer_id, quotation.quote_date);
    } catch (err) {
      // Log but don't fail the request
      console.error('Failed to update customer last_quote_date:', err);
    }

    // Return with customer info
    const quotationWithCustomer = getQuotationByIdWithCustomer(quotation.id);

    return NextResponse.json({ quotation: quotationWithCustomer }, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
