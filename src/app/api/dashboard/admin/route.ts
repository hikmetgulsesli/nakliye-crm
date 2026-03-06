import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getAdminDashboardMetrics,
  getAdminPersonnelPerformance,
  getAdminOriginCountries,
  getAdminDestinationCountries,
  getAdminModeDistribution,
  getAdminLossReasons,
} from '@/lib/db/reports';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default to last 30 days if not provided
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const finalStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const finalEndDate = endDate || now.toISOString().split('T')[0];

    // Fetch all admin dashboard data in parallel
    const [
      metrics,
      personnelPerformance,
      originCountries,
      destinationCountries,
      modeDistribution,
      lossReasons,
    ] = await Promise.all([
      getAdminDashboardMetrics(finalStartDate, finalEndDate),
      getAdminPersonnelPerformance(finalStartDate, finalEndDate),
      getAdminOriginCountries(finalStartDate, finalEndDate),
      getAdminDestinationCountries(finalStartDate, finalEndDate),
      getAdminModeDistribution(finalStartDate, finalEndDate),
      getAdminLossReasons(finalStartDate, finalEndDate),
    ]);

    return NextResponse.json({
      data: {
        metrics,
        personnelPerformance,
        originCountries,
        destinationCountries,
        modeDistribution,
        lossReasons,
        dateRange: {
          startDate: finalStartDate,
          endDate: finalEndDate,
        },
      },
    });
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data' },
      { status: 500 }
    );
  }
}
