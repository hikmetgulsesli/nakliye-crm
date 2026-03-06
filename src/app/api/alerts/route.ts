import { NextRequest, NextResponse } from 'next/server.js';
import { getAlerts, getAlertCounts } from '@/lib/db/alerts.js';
import type { AlertFilter } from '@/types/index.js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countsOnly = searchParams.get('counts') === 'true';
    if (countsOnly) {
      const counts = getAlertCounts();
      return NextResponse.json({ data: counts });
    }
    const filter: AlertFilter = {};
    const type = searchParams.get('type');
    if (type) filter.type = type as AlertFilter['type'];
    const status = searchParams.get('status');
    if (status) filter.status = status as AlertFilter['status'];
    const severity = searchParams.get('severity');
    if (severity) filter.severity = severity as AlertFilter['severity'];
    const assignedUserId = searchParams.get('assigned_user_id');
    if (assignedUserId) filter.assigned_user_id = assignedUserId;
    const alerts = getAlerts(filter);
    return NextResponse.json({ data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch alerts' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'regenerate') {
      return NextResponse.json({ data: { no_contact: 0, pending_quotes: 0, expired_quotes: 0, high_potential: 0, total: 0, message: 'Alert regeneration stub' } });
    }
    return NextResponse.json({ error: { code: 'INVALID_ACTION', message: 'Invalid action. Use "regenerate".' } }, { status: 400 });
  } catch (error) {
    console.error('Error regenerating alerts:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to regenerate alerts' } }, { status: 500 });
  }
}
