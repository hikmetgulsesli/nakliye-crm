import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default async function PerformanceReportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/reports");
  }

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Personnel Performance"
    >
      <div className="space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
            Personnel Performance Report
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Detailed personnel performance analytics will be available in a future update.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
