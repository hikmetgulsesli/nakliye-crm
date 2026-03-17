import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Plus,
  Calendar,
  MapPin,
  User,
  FileText,
  Building2,
} from "lucide-react";

async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { firstName: true, lastName: true, email: true },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  return customer;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title={customer.companyName}
      actions={
        <Link
          href={`/customers/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Company Name
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {customer.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Contact Person
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {customer.contactName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {customer.phone}
                  </a>
                </div>
                {customer.address && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Address
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {customer.address}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Quotations */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Quotations
                </h3>
                <Link
                  href={`/quotations/new?customer=${id}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  New Quote
                </Link>
              </div>
              {customer.quotations.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No quotations yet
                </p>
              ) : (
                <div className="space-y-3">
                  {customer.quotations.map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/quotations/${quote.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {quote.quoteNumber}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {quote.originCity} → {quote.destinationCity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {quote.totalCost ? Number(quote.totalCost).toLocaleString() : "-"} {quote.currency}
                        </p>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CRM Info */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                CRM Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {customer.status.charAt(0) + customer.status.slice(1).toLowerCase()}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/quotations/new?customer=${id}`}
                  className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Quotation
                </Link>
                <Link
                  href={`/customers/${id}/activity`}
                  className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Log Activity
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              {customer.activities.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                  No activities yet
                </p>
              ) : (
                <div className="space-y-4">
                  {customer.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-2 border-primary pl-4"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {activity.type}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(activity.createdAt).toLocaleDateString()} •{" "}
                        {activity.user.firstName} {activity.user.lastName}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    WON: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    LOST: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[status] || colors.PENDING
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
