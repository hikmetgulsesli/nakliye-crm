import { NextRequest, NextResponse } from 'next/server.js';
import { getAlertById, markAlertAsReviewed, dismissAlert } from '@/lib/db/alerts.js';

interface RouteParams { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const alert = getAlertById(id);
    if (!alert) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Alert not found' } }, { status: 404 });
    }
    if (body.action === 'review') {
      const reviewedBy = body.reviewed_by || 'system';
      const updatedAlert = markAlertAsReviewed(id, reviewedBy);
      return NextResponse.json({ data: updatedAlert });
    }
    if (body.action === 'dismiss') {
      const updatedAlert = dismissAlert(id);
      return NextResponse.json({ data: updatedAlert });
    }
    return NextResponse.json({ error: { code: 'INVALID_ACTION', message: 'Invalid action. Use "review" or "dismiss".' } }, { status: 400 });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update alert' } }, { status: 500 });
  }
}
