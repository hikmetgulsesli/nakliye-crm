import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserDashboardMetrics, getUpcomingFollowUps, getRecentActivities } from '@/lib/db/user-dashboard';

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user-specific dashboard data in parallel
    const [metrics, upcomingFollowUps, recentActivities] = await Promise.all([
      getUserDashboardMetrics(userId),
      getUpcomingFollowUps(userId, 5),
      getRecentActivities(userId, 10),
    ]);

    return NextResponse.json({
      data: {
        metrics,
        upcomingFollowUps,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('User dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}