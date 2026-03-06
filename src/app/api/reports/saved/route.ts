import { NextRequest, NextResponse } from 'next/server';
import {
  saveReportParams,
  getSavedReports,
  deleteSavedReport,
} from '@/lib/db/reports';
import { verifyToken } from '@/lib/auth/utils';
import type { ReportType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
<<<<<<< HEAD
    if (!payload || !payload.sub) {
=======
    if (!payload || typeof payload.userId !== 'number') {
>>>>>>> origin/feature/crm-core-modules
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType') as ReportType | undefined;

<<<<<<< HEAD
    const reports = getSavedReports(parseInt(payload.sub, 10), reportType);
=======
    const reports = getSavedReports(payload.userId, reportType);
>>>>>>> origin/feature/crm-core-modules
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Get saved reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
<<<<<<< HEAD
    if (!payload || !payload.sub) {
=======
    if (!payload || typeof payload.userId !== 'number') {
>>>>>>> origin/feature/crm-core-modules
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { reportType, name, params } = body;

    if (!reportType || !name || !params) {
      return NextResponse.json(
        { error: 'reportType, name, and params are required' },
        { status: 400 }
      );
    }

    const saved = saveReportParams(
<<<<<<< HEAD
      parseInt(payload.sub, 10),
=======
      payload.userId,
>>>>>>> origin/feature/crm-core-modules
      reportType as ReportType,
      name,
      params
    );

    return NextResponse.json({ report: saved }, { status: 201 });
  } catch (error) {
    console.error('Save report error:', error);
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
<<<<<<< HEAD
    if (!payload || !payload.sub) {
=======
    if (!payload || typeof payload.userId !== 'number') {
>>>>>>> origin/feature/crm-core-modules
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    const deleted = deleteSavedReport(parseInt(id, 10), parseInt(payload.sub, 10));
=======
    const deleted = deleteSavedReport(parseInt(id, 10), payload.userId);
>>>>>>> origin/feature/crm-core-modules

    if (!deleted) {
      return NextResponse.json(
        { error: 'Report not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved report' },
      { status: 500 }
    );
  }
}
