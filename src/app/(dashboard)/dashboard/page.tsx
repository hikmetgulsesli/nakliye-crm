import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { UserMetricsCards } from "@/components/dashboard/user-metrics-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingFollowUps } from "@/components/dashboard/upcoming-follow-ups";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { AlertWidgets } from "@/components/alerts/alert-widgets";

export const metadata: Metadata = {
  title: "Dashboard | Nakliye CRM",
  description: "Kullanıcı Dashboard - Kişisel metrikler ve aktiviteler",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const userName = session.user?.name || session.user?.email || 'Kullanıcı';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hoş Geldiniz, {userName}
        </h1>
        <p className="text-gray-500 mt-1">
          Bugün neler yapmak istersiniz?
        </p>
      </div>

      {/* Alert Widgets */}
      <AlertWidgets autoRefresh={true} refreshInterval={60000} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Personal Metrics */}
      <UserMetricsCards autoRefresh={true} refreshInterval={60000} />

      {/* Two Column Layout: Follow-ups & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingFollowUps limit={5} autoRefresh={true} refreshInterval={60000} />
        <RecentActivityFeed limit={10} autoRefresh={true} refreshInterval={60000} />
      </div>
    </div>
  );
}