import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, Users, TrendingUp, Globe } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Reports"
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportCard
            title="Periodic Quotation Report"
            description="View all quotations for a specific time period with filters"
            icon={FileText}
            href="/reports/quotations"
            color="blue"
          />
          <ReportCard
            title="Personnel Performance"
            description="Track team performance and individual metrics"
            icon={Users}
            href="/reports/performance"
            color="green"
            adminOnly
            isAdmin={isAdmin}
          />
          <ReportCard
            title="Win/Loss Analysis"
            description="Analyze won and lost quotations with reasons"
            icon={TrendingUp}
            href="/reports/winloss"
            color="purple"
            adminOnly
            isAdmin={isAdmin}
          />
          <ReportCard
            title="Geographic Distribution"
            description="View quotation distribution by countries and routes"
            icon={Globe}
            href="/reports/geographic"
            color="amber"
            adminOnly
            isAdmin={isAdmin}
          />
        </div>

        {/* Coming Soon */}
        {!isAdmin && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Additional reports are available for administrators. Contact your admin for access.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: "blue" | "green" | "purple" | "amber";
  adminOnly?: boolean;
  isAdmin?: boolean;
}

function ReportCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  adminOnly,
  isAdmin,
}: ReportCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  if (adminOnly && !isAdmin) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 opacity-60">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                Admin
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-primary/50 dark:hover:border-primary/50 transition-colors group block"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              {title}
            </h3>
            {adminOnly && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
