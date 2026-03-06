<<<<<<< HEAD
=======
<<<<<<< HEAD
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
=======
>>>>>>> origin/feature/crm-core-modules
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
<<<<<<< HEAD

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
>>>>>>> origin/feature/crm-core-modules
  }

  const userName = session.user?.name || session.user?.email || 'Kullanıcı';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
<<<<<<< HEAD
=======
<<<<<<< HEAD
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          Hoş geldiniz, {session.user.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Toplam Müşteri</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Aktif Teklifler</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Bu Ay Teklif</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Kazanma Oranı</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-%</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Son Aktiviteler</h2>
        <p className="mt-4 text-slate-500">Henüz aktivite kaydı bulunmuyor.</p>
=======
>>>>>>> origin/feature/crm-core-modules
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
<<<<<<< HEAD
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
>>>>>>> origin/feature/crm-core-modules
      </div>
    </div>
  );
}