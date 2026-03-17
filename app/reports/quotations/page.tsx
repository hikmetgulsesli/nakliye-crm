import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Filter } from "lucide-react";

async function getQuotations(startDate?: string, endDate?: string) {
  const where: Record<string, unknown> = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: {
        select: { companyName: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return quotations;
}

export default async function QuotationsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const quotations = await getQuotations(params.start, params.end);

  const totalValue = quotations.reduce((sum, q) => sum + Number(q.totalCost || 0), 0);
  const wonCount = quotations.filter((q) => q.status === "ACCEPTED").length;
  const pendingCount = quotations.filter((q) => q.status === "SENT" || q.status === "DRAFT").length;

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Quotation Report"
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </Link>

        {/* Filters */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filter by Date Range
          </h3>
          <form className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start"
                defaultValue={params.start || ""}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="end"
                defaultValue={params.end || ""}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
              {(params.start || params.end) && (
                <Link
                  href="/reports/quotations"
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Quotations" value={quotations.length} color="blue" />
          <SummaryCard title="Total Value" value={`$${totalValue.toLocaleString()}`} color="indigo" />
          <SummaryCard title="Win Rate" value={`${quotations.length > 0 ? Math.round((wonCount / quotations.length) * 100) : 0}%`} color="green" />
          <SummaryCard title="Pending" value={pendingCount} color="amber" />
        </div>

        {/* Quotations Table */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Quotation Details
            </h3>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {quotations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No quotations found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Quote No
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {quotations.map((quote) => (
                    <tr
                      key={quote.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/quotations/${quote.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {quote.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {quote.customer.companyName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {quote.originCity} → {quote.destinationCity}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <QuoteStatusBadge status={quote.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {Number(quote.totalCost || 0).toLocaleString()} {quote.currency}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: "blue" | "indigo" | "green" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className={`p-6 rounded-xl ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
    SENT: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    ACCEPTED: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    EXPIRED: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    CANCELLED: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
  };

  const labels: Record<string, string> = {
    DRAFT: "Draft",
    SENT: "Sent",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || colors.DRAFT
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
