import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
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
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back, {session.user.name}! You are logged in as{" "}
            {session.user.role}.
          </p>
        </div>
      </main>
    </div>
  );
}
