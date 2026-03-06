import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  getQuotationById, 
  getQuotationByIdWithDetails,
  updateQuotation,
  softDeleteQuotation
} from '@/lib/db/quotations';
import { createRevision, computeChanges, getNextRevisionNumber } from '@/lib/db/quotation-revisions';
import { getAllUsers } from '@/lib/db/users';
import type { UpdateQuotationInput } from '@/types';

const VALID_TRANSPORT_MODES = ['Deniz', 'Hava', 'Kara', 'Kombine'] as const;
const VALID_SERVICE_TYPES = ['FCL', 'LCL', 'Parsiyel', 'Komple', 'Bulk', 'RoRo'] as const;
const VALID_INCOTERMS = ['FOB', 'EXW', 'FCA', 'DAP', 'CIF', 'CFR', 'DDP'] as const;
const VALID_STATUSES = ['Bekliyor', 'Kazanildi', 'Kaybedildi'] as const;
const VALID_LOSS_REASONS = ['Fiyat', 'Rakip', 'Gecikmeli donus', 'Diger'] as const;
const VALID_CURRENCIES = ['USD', 'EUR', 'TRY'] as const;

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
    const quotation = getQuotationByIdWithDetails(id);
    
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingQuotation = getQuotationById(id);
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate status and loss_reason relationship
    const newStatus = body.status || existingQuotation.status;
    const newLossReason = body.loss_reason !== undefined 
      ? body.loss_reason 
      : existingQuotation.loss_reason;
    
    if (newStatus === 'Kaybedildi' && !newLossReason) {
      return NextResponse.json(
        { error: 'Validation failed', errors: ['Kaybedilme nedeni seçilmelidir'] },
        { status: 400 }
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

    // Build input object
    const input: UpdateQuotationInput = {};

    if (body.customer_id !== undefined) {
      input.customer_id = body.customer_id.trim();
    }
    if (body.quote_date !== undefined) {
      input.quote_date = body.quote_date.trim();
    }
    if (body.valid_until !== undefined) {
      input.valid_until = body.valid_until?.trim() || null;
    }
    if (body.transport_mode !== undefined) {
      input.transport_mode = VALID_TRANSPORT_MODES.includes(body.transport_mode)
        ? body.transport_mode
        : undefined;
    }
    if (body.service_type !== undefined) {
      input.service_type = VALID_SERVICE_TYPES.includes(body.service_type)
        ? body.service_type
        : undefined;
    }
    if (body.origin_country !== undefined) {
      input.origin_country = body.origin_country.trim();
    }
    if (body.destination_country !== undefined) {
      input.destination_country = body.destination_country.trim();
    }
    if (body.pol !== undefined) {
      input.pol = body.pol?.trim() || null;
    }
    if (body.pod !== undefined) {
      input.pod = body.pod?.trim() || null;
    }
    if (body.incoterm !== undefined) {
      input.incoterm = VALID_INCOTERMS.includes(body.incoterm)
        ? body.incoterm
        : undefined;
    }
    if (body.price !== undefined) {
      const priceNum = Number(body.price);
      if (!isNaN(priceNum) && priceNum >= 0) {
        input.price = priceNum;
      }
    }
    if (body.currency !== undefined) {
      input.currency = VALID_CURRENCIES.includes(body.currency)
        ? body.currency
        : undefined;
    }
    if (body.price_note !== undefined) {
      input.price_note = body.price_note?.trim() || null;
    }
    if (body.status !== undefined) {
      input.status = VALID_STATUSES.includes(body.status)
        ? body.status
        : undefined;
    }
    if (body.loss_reason !== undefined) {
      input.loss_reason = VALID_LOSS_REASONS.includes(body.loss_reason)
        ? body.loss_reason
        : null;
    }
    if (body.assigned_user_id !== undefined) {
      input.assigned_user_id = body.assigned_user_id;
    }

    // Compute changes for revision tracking
    const oldData: Record<string, unknown> = {
      customer_id: existingQuotation.customer_id,
      quote_date: existingQuotation.quote_date,
      valid_until: existingQuotation.valid_until,
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
      ...Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined)
      ),
    };

    const changes = computeChanges(oldData, newData);
    const hasChanges = changes.length > 0;

    // Update quotation with revision increment if there are changes
    const quotation = updateQuotation(id, input, hasChanges);

    if (!quotation) {
      return NextResponse.json(
        { error: 'Failed to update quotation' },
        { status: 500 }
      );
    }

    // Create revision record if there are changes
    if (hasChanges) {
      const revisionNo = getNextRevisionNumber(id);
      createRevision(id, revisionNo, changes, session.user.id);
    }

    return NextResponse.json({ quotation });
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
    const existingQuotation = getQuotationById(id);
    
    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Only admins can delete quotations
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const success = softDeleteQuotation(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete quotation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}