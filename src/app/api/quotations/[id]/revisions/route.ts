import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getQuotationById } from '@/lib/db/quotations';
import { getRevisionsByQuotationId } from '@/lib/db/quotation-revisions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if quotation exists
    const quotation = getQuotationById(id, true); // Include deleted
    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    const revisions = getRevisionsByQuotationId(id);
    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}
