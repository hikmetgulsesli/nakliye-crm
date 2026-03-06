import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  getQuotationById, 
  getQuotationByIdWithCustomer,
  updateQuotation,
  softDeleteQuotation,
  deleteQuotation,
  incrementRevisionCount 
} from '@/lib/db/quotations';
import { createRevision, calculateDiff } from '@/lib/db/quotation-revisions';
import type { QuoteStatus, LossReason, Currency, UpdateQuotationInput } from '@/types';

const VALID_STATUSES: QuoteStatus[] = ['Bekliyor', 'Kazanildi', 'Kaybedildi'];
const VALID_LOSS_REASONS: LossReason[] = ['Fiyat', 'Rakip', 'Gecikmeli donus', 'Diger'];
const VALID_CURRENCIES: Currency[] = ['USD', 'EUR', 'TRY'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    const quotation = getQuotationByIdWithCustomer(id, includeDeleted);
    
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get existing quotation for diff calculation
    const existingQuotation = getQuotationById(id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Cannot update deleted quotations
    if (existingQuotation.deleted_at) {
      return NextResponse.json(
        { error: 'Cannot update deleted quotation' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate fields if provided
    const validationErrors: Array<{ field: string; message: string }> = [];
    
    if (body.quote_date !== undefined && !isValidDate(body.quote_date)) {
      validationErrors.push({ field: 'quote_date', message: 'Geçerli bir tarih giriniz' });
    }
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      validationErrors.push({ field: 'status', message: 'Geçersiz durum değeri' });
    }
    if (body.loss_reason !== undefined && !VALID_LOSS_REASONS.includes(body.loss_reason)) {
      validationErrors.push({ field: 'loss_reason', message: 'Geçersiz kaybetme nedeni' });
    }
    if (body.currency !== undefined && !VALID_CURRENCIES.includes(body.currency)) {
      validationErrors.push({ field: 'currency', message: 'Geçersiz para birimi' });
    }
    if (body.price !== undefined && body.price !== null) {
      if (typeof body.price !== 'number' || body.price < 0) {
        validationErrors.push({ field: 'price', message: 'Fiyat pozitif bir sayı olmalıdır' });
      }
    }
    if (body.validity_date !== undefined && body.validity_date !== null && !isValidDate(body.validity_date)) {
      validationErrors.push({ field: 'validity_date', message: 'Geçerli bir tarih giriniz' });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    const input: UpdateQuotationInput = {};
    
    // Only include fields that are provided
    if (body.customer_id !== undefined) input.customer_id = body.customer_id?.trim();
    if (body.quote_date !== undefined) input.quote_date = body.quote_date?.trim();
    if (body.validity_date !== undefined) input.validity_date = body.validity_date?.trim() || null;
    if (body.transport_mode !== undefined) input.transport_mode = body.transport_mode?.trim();
    if (body.service_type !== undefined) input.service_type = body.service_type?.trim();
    if (body.origin_country !== undefined) input.origin_country = body.origin_country?.trim();
    if (body.destination_country !== undefined) input.destination_country = body.destination_country?.trim();
    if (body.pol !== undefined) input.pol = body.pol?.trim() || null;
    if (body.pod !== undefined) input.pod = body.pod?.trim() || null;
    if (body.incoterm !== undefined) input.incoterm = body.incoterm?.trim();
    if (body.price !== undefined) input.price = body.price ?? null;
    if (body.currency !== undefined) input.currency = body.currency || null;
    if (body.price_note !== undefined) input.price_note = body.price_note?.trim() || null;
    if (body.status !== undefined) input.status = body.status;
    if (body.loss_reason !== undefined) input.loss_reason = body.loss_reason || null;
    if (body.assigned_user_id !== undefined) input.assigned_user_id = body.assigned_user_id?.trim();

    // Calculate diff for revision tracking
    const oldData: Record<string, unknown> = {
      customer_id: existingQuotation.customer_id,
      quote_date: existingQuotation.quote_date,
      validity_date: existingQuotation.validity_date,
      transport_mode: existingQuotation.transport_mode,
      service_type: existingQuotation.service_type,
      origin_country: existingQuotation.origin_country,
      destination_country: existingQuotation.destination_country,
      pol: existingQuotation.pol,
      pod: existingQuotation.pod,
      incoterm: existingQuotation.incoterm,
      price: existingQuotation.price,
      currency: existingQuotation.currency,
      price_note: existingQuotation.price_note,
      status: existingQuotation.status,
      loss_reason: existingQuotation.loss_reason,
      assigned_user_id: existingQuotation.assigned_user_id,
    };

    const newData: Record<string, unknown> = {
      ...oldData,
      ...input,
    };

    const changes = calculateDiff(oldData, newData);

    // Update quotation
    const updated = updateQuotation(id, input);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update quotation' },
        { status: 500 }
      );
    }

    // Create revision record if there are changes
    if (changes.length > 0) {
      createRevision(id, changes, session.user.id);
      incrementRevisionCount(id);
    }

    // Return updated quotation with customer info
    const quotationWithCustomer = getQuotationByIdWithCustomer(id);

    return NextResponse.json({ quotation: quotationWithCustomer });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to update quotation' },
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Only admins can hard delete
    if (hardDelete && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can hard delete' },
        { status: 403 }
      );
    }

    const existingQuotation = getQuotationById(id);
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete - only for admins
      const success = deleteQuotation(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to delete quotation' },
          { status: 500 }
        );
      }
    } else {
      // Soft delete
      const success = softDeleteQuotation(id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to delete quotation' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
