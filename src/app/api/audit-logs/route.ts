import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    { error: { code, message } },
    { status }
  );
}

// GET /api/audit-logs - Get audit logs
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const recordType = searchParams.get('record_type') || undefined;
    const recordId = searchParams.has('record_id')
      ? parseInt(searchParams.get('record_id')!, 10)
      : undefined;
    const userId = searchParams.has('user_id')
      ? parseInt(searchParams.get('user_id')!, 10)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const logs = await getAuditLogs(recordType, recordId, userId, limit, offset);

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch audit logs', 500);
  }
}
