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
  Mail,
  RotateCcw,
  FileText,
  Plane,
  Ship,
  Truck,
  ArrowRight,
  User,
  Calendar,
} from "lucide-react";

async function getQuotation(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return quotation;
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    notFound();
  }

  const TransportIcon =
    {
      SEA: Ship,
      AIR: Plane,
      ROAD: Truck,
      RAIL: Ship,
      MULTIMODAL: Ship,
    }[quotation.transportMode] || Ship;

  return (
    <DashboardLayout
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role,
      }}
      title={`Quotation ${quotation.quoteNumber}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href={`/quotations/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotations
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Header */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <TransportIcon className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {quotation.quoteNumber}
                    </h2>
                  </div>
                  <Link
                    href={`/customers/${quotation.customer.id}`}
                    className="text-lg text-primary hover:underline"
                  >
                    {quotation.customer.companyName}
                  </Link>
                </div>
                <QuoteStatusBadge status={quotation.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quote Date
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(quotation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Valid Until
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quotation.validUntil
                      ? new Date(quotation.validUntil).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Service Type
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quotation.transportMode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Incoterm
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quotation.incoterm}
                  </p>
                </div>
              </div>
            </section>

            {/* Route Information */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Route Information
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Port of Loading (POL)
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {quotation.originCity}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {quotation.originCountry}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Port of Discharge (POD)
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {quotation.destinationCity}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {quotation.destinationCountry}
                  </p>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Pricing
              </h3>
              <div className="flex items-end justify-between p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Total Price
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {quotation.totalCost ? Number(quotation.totalCost).toLocaleString() : "0"}{" "}
                    <span className="text-lg text-slate-500 dark:text-slate-400">
                      {quotation.currency}
                    </span>
                  </p>
                </div>
              </div>
              {quotation.internalNotes && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Notes
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">
                    {quotation.internalNotes}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {quotation.customer.companyName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {quotation.customer.contactName}
                  </p>
                </div>
                {quotation.customer.email && (
                  <a
                    href={`mailto:${quotation.customer.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {quotation.customer.email}
                  </a>
                )}
              </div>
            </section>

            {/* Created By */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Created By
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {quotation.createdBy.firstName} {quotation.createdBy.lastName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {new Date(quotation.createdAt).toLocaleDateString()}
              </p>
            </section>

            {/* Quick Actions */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                <a
                  href={`mailto:${quotation.customer.email}?subject=Quotation ${quotation.quoteNumber}`}
                  className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Email Customer
                </a>
                <Link
                  href={`/customers/${quotation.customer.id}`}
                  className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <User className="w-5 h-5" />
                  View Customer
                </Link>
              </div>
            </section>
          </div>
        </div>
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
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        colors[status] || colors.DRAFT
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
