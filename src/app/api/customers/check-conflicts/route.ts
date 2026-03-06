import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { checkConflicts } from '@/lib/db/customers';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyName = searchParams.get('company_name') || '';
    const phone = searchParams.get('phone') || '';
    const email = searchParams.get('email') || '';
    const excludeId = searchParams.get('exclude_id') || undefined;

    if (!companyName && !phone && !email) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    const conflicts = checkConflicts(companyName, phone, email, excludeId);

    return NextResponse.json({ conflicts });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    );
  }
}
