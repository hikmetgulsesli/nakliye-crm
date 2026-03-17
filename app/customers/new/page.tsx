import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getLookupValues() {
  const [
    transportModes,
    serviceTypes,
    incoterms,
    sources,
    statuses,
    countries,
  ] = await Promise.all([
    prisma.lookupValue.findMany({
      where: { category: "transport_mode", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "service_type", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "incoterm", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "source", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "customer_status", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lookupValue.findMany({
      where: { category: "country", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return {
    transportModes,
    serviceTypes,
    incoterms,
    sources,
    statuses,
    countries,
  };
}

async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });
}

export default async function NewCustomerPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [lookups, users] = await Promise.all([
    getLookupValues(),
    getUsers(),
  ]);

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title="Add Customer"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>

        <form action="/api/customers" method="POST" className="space-y-6">
          {/* Basic Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter full address"
                />
              </div>
            </div>
          </section>

          {/* Shipping Preferences */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              Shipping Preferences
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transport Modes
                </label>
                <div className="flex flex-wrap gap-3">
                  {lookups.transportModes.map((mode) => (
                    <label
                      key={mode.id}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        name="transportModes"
                        value={mode.value}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {mode.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Service Types
                </label>
                <div className="flex flex-wrap gap-3">
                  {lookups.serviceTypes.map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        name="serviceTypes"
                        value={type.value}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preferred Incoterms
                  </label>
                  <select
                    name="incoterms"
                    multiple
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    size={4}
                  >
                    {lookups.incoterms.map((incoterm) => (
                      <option key={incoterm.id} value={incoterm.value}>
                        {incoterm.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Hold Ctrl/Cmd to select multiple
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Origin Countries
                  </label>
                  <select
                    name="originCountries"
                    multiple
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    size={4}
                  >
                    {lookups.countries.map((country) => (
                      <option key={country.id} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* CRM Information */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              CRM Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Source
                </label>
                <select
                  name="source"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select source</option>
                  {lookups.sources.map((source) => (
                    <option key={source.id} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {lookups.statuses.map((status) => (
                    <option key={status.id} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Assigned To
                </label>
                <select
                  name="assignedToId"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add any notes about this customer..."
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/customers"
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
