import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuditLogsByRecord, getAuditLogsByCustomer, getRecentAuditLogs } from '@/lib/db/audit-log';
import { getSession } from '@/lib/auth/session';

const querySchema = z.object({
  record_type: z.enum(['customer', 'quotation', 'activity', 'user'] as const).optional(),
  record_id: z.string().optional(),
  customer_id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Oturum gerekli' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      record_type: searchParams.get('record_type'),
      record_id: searchParams.get('record_id'),
      customer_id: searchParams.get('customer_id'),
      limit: searchParams.get('limit') || '50',
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Geçersiz sorgu parametreleri',
            details: validation.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      );
    }

    const { record_type, record_id, customer_id, limit } = validation.data;

    let logs;

    if (customer_id) {
      // Get all logs related to a customer
      logs = getAuditLogsByCustomer(customer_id);
    } else if (record_type && record_id) {
      // Get logs for a specific record
      logs = getAuditLogsByRecord(record_type, record_id);
    } else {
      // Get recent logs
      logs = getRecentAuditLogs(limit);
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/audit-log error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Audit logları yüklenirken bir hata oluştu' } },
      { status: 500 }
    );
  }
}