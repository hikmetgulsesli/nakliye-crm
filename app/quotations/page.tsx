import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Filter, FileText, ArrowRight } from "lucide-react";

async function getQuotations(
  search?: string,
  status?: string,
  transportMode?: string
) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status && status !== "all") {
    where.status = status;
  }

  if (transportMode && transportMode !== "all") {
    where.transportMode = transportMode;
  }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: {
        select: { companyName: true, id: true },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return quotations;
}

async function getLookupValues() {
  const [statuses, transportModes] = await Promise.all([
    prisma.lookupValue.findMany({
      where: { category: "quotation_status", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "transport_mode", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return { statuses, transportModes };
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    transportMode?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const [quotations, lookups] = await Promise.all([
    getQuotations(params.search, params.status, params.transportMode),
    getLookupValues(),
  ]);

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Quotations"
      actions={
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <form action="/quotations" method="GET">
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="Search by quote number or customer..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>
          <div className="flex gap-3">
            <form action="/quotations" method="GET" className="flex gap-3">
              <select
                name="status"
                defaultValue={params.status || "all"}
                onChange={(e) => e.target.form?.submit()}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                {lookups.statuses.map((s) => (
                  <option key={s.id} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                name="transportMode"
                defaultValue={params.transportMode || "all"}
                onChange={(e) => e.target.form?.submit()}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Modes</option>
                {lookups.transportModes.map((t) => (
                  <option key={t.id} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {(params.search || params.status || params.transportMode) && (
                <Link
                  href="/quotations"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </Link>
              )}
            </form>
          </div>
        </div>

        {/* Quotations Grid */}
        {quotations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No quotations found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Create your first quotation to get started
            </p>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Quotation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quotations.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotations/${quote.id}`}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-primary/50 dark:hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {quote.quoteNumber}
                    </p>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-1 group-hover:text-primary transition-colors">
                      {quote.customer.companyName}
                    </h4>
                  </div>
                  <QuoteStatusBadge status={quote.status} />
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <span className="font-medium">{quote.originCity}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{quote.destinationCity}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {quote.transportMode}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {quote.totalCost ? Number(quote.totalCost).toLocaleString() : "0"} {quote.currency}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {quote.incoterm}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
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
