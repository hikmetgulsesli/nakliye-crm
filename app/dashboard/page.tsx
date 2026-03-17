import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {session.user.name} ({session.user.role})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {isAdmin ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </main>
    </div>
  );
}
