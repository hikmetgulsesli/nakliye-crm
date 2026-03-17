import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Filter, Phone, Mail, Building2 } from "lucide-react";

async function getCustomers(search?: string, status?: string) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "all") {
    where.status = status;
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      assignedTo: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return customers;
}

async function getLookupValues() {
  const statuses = await prisma.lookupValue.findMany({
    where: { category: "customer_status", isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return { statuses };
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const [customers, lookups] = await Promise.all([
    getCustomers(params.search, params.status),
    getLookupValues(),
  ]);

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Customers"
      actions={
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <form action="/customers" method="GET">
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="Search by company, contact, or email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>
          <div className="flex gap-3">
            <form action="/customers" method="GET" className="flex gap-3">
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
              {(params.search || params.status) && (
                <Link
                  href="/customers"
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </Link>
              )}
            </form>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No customers found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Get started by adding your first customer
              </p>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Last Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="block"
                        >
                          <p className="font-medium text-slate-900 dark:text-white hover:text-primary transition-colors">
                            {customer.companyName}
                          </p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-900 dark:text-white">
                            {customer.contactName || "-"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                            {customer.email && (
                              <a
                                href={`mailto:${customer.email}`}
                                className="hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                            {customer.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {customer.assignedTo
                            ? `${customer.assignedTo.firstName} ${customer.assignedTo.lastName}`
                            : "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {customer.lastContactDate
                            ? new Date(
                                customer.lastContactDate
                              ).toLocaleDateString()
                            : "Never"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    INACTIVE:
      "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300",
    PROSPECT:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    BLACKLISTED:
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  const labels: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    PROSPECT: "Prospect",
    BLACKLISTED: "Blacklisted",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status] || colors.INACTIVE
      }`}
    >
      {labels[status] || status}
    </span>
  );
}


