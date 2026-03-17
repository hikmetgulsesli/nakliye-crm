import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ReportsClient from "@/components/reports/ReportsClient";

export const metadata: Metadata = {
  title: "Reports - ShipFlow CRM",
  description: "Generate and export administrative reports",
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-6 text-primary">
            <span className="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
            ShipFlow CRM
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <a
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              href="/dashboard"
            >
              Dashboard
            </a>
            <a
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              href="#"
            >
              Shipments
            </a>
            <a
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              href="#"
            >
              Quotations
            </a>
            <a
              className="text-sm font-bold leading-normal text-primary border-b-2 border-primary pb-1"
              href="/reports"
            >
              Reports
            </a>
            <a
              className="text-sm font-medium leading-normal text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
              href="#"
            >
              Settings
            </a>
          </nav>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        <ReportsClient userRole={session.user.role} />
      </main>
    </div>
  );
}
