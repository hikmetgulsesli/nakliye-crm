import { NextRequest, NextResponse } from 'next/server';
import { getWonLostAnalysis } from '@/lib/db/reports';
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

    // Check admin role
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const assignedUserId = searchParams.get('assignedUserId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const analysis = getWonLostAnalysis(
      startDate,
      endDate,
      assignedUserId ? parseInt(assignedUserId, 10) : undefined
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Won/Lost analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate won/lost analysis' },
      { status: 500 }
    );
  }
}
