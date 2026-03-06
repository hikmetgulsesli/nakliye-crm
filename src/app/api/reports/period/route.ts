import { NextRequest, NextResponse } from 'next/server';
import { getPeriodReportStats, getPeriodReportRows } from '@/lib/db/reports';
import { verifyToken } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') as 'pending' | 'won' | 'lost' | undefined;
    const assignedUserId = searchParams.get('assignedUserId');
    const currency = searchParams.get('currency') as 'USD' | 'EUR' | 'TRY' | undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const filters = {
      startDate,
      endDate,
      ...(status && { status }),
      ...(assignedUserId && { assignedUserId: parseInt(assignedUserId, 10) }),
      ...(currency && { currency }),
    };

    const [stats, rows] = await Promise.all([
      getPeriodReportStats(filters),
      getPeriodReportRows(filters),
    ]);

    return NextResponse.json({ stats, rows });
  } catch (error) {
    console.error('Period report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate period report' },
      { status: 500 }
    );
  }
}
