"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  CheckCircle, 
  Users, 
  Calendar, 
  Phone, 
  Clock,
  Activity,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { DashboardWidget } from "./dashboard-widget";
import Link from "next/link";
import type { 
  UserDashboardData, 
  UpcomingFollowUp, 
  CustomerToCall,
  PendingQuote,
  RecentActivity 
} from "@/lib/dashboard";

const activityTypeLabels: Record<string, string> = {
  CALL: "Phone Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
  QUOTE_CREATED: "Quote Created",
  QUOTE_SENT: "Quote Sent",
  QUOTE_ACCEPTED: "Quote Accepted",
  QUOTE_REJECTED: "Quote Rejected",
  STATUS_CHANGE: "Status Change",
  DOCUMENT_ADDED: "Document Added",
  FOLLOW_UP: "Follow-up",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDashboard() {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Error loading dashboard: {error || "Unknown error"}
      </div>
    );
  }

  const { metrics, upcomingFollowUps, customersToCall, pendingQuotes, recentActivities } = data;

  return (
    <div className="space-y-6">
      {/* Personal Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Quotes This Week"
          value={metrics.quotesThisWeek}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Quotes This Month"
          value={metrics.quotesThisMonth}
          subtitle={`${metrics.quotesWonThisMonth} won (${metrics.winRateThisMonth}%)`}
          icon={<FileText className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Win Rate"
          value={`${metrics.winRateThisMonth}%`}
          subtitle="This month"
          icon={<CheckCircle className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Customers Contacted"
          value={metrics.customersContactedThisMonth}
          subtitle="This month"
          icon={<Users className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Follow-ups */}
        <DashboardWidget
          title="Upcoming Follow-ups"
          badge={upcomingFollowUps.length}
          badgeColor="blue"
          href="/activities"
          isEmpty={upcomingFollowUps.length === 0}
          emptyMessage="No upcoming follow-ups"
        >
          <ul className="space-y-3">
            {upcomingFollowUps.map((followUp: UpcomingFollowUp) => (
              <li key={followUp.id} className="flex items-start gap-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {followUp.subject}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {followUp.customerName} • Due {formatDate(followUp.dueDate)}
                  </p>
                </div>
                <Link
                  href={`/customers/${followUp.customerId}`}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        {/* Customers to Call */}
        <DashboardWidget
          title="Customers to Call"
          badge={customersToCall.length}
          badgeColor="red"
          href="/customers"
          isEmpty={customersToCall.length === 0}
          emptyMessage="All customers contacted recently"
        >
          <ul className="space-y-3">
            {customersToCall.map((customer: CustomerToCall) => (
              <li key={customer.id} className="flex items-start gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-rose-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {customer.companyName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customer.daysSinceContact === 999 
                      ? "No contact recorded" 
                      : `${customer.daysSinceContact} days since last contact`}
                  </p>
                </div>
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Call
                </Link>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        {/* Pending Quotes */}
        <DashboardWidget
          title="Pending Quotes (7+ days)"
          badge={pendingQuotes.length}
          badgeColor="amber"
          href="/quotations"
          isEmpty={pendingQuotes.length === 0}
          emptyMessage="No pending quotes"
        >
          <ul className="space-y-3">
            {pendingQuotes.map((quote: PendingQuote) => (
              <li key={quote.id} className="flex items-start gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {quote.quoteNumber}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {quote.customerName} • {quote.daysPending} days pending
                    {quote.totalCost && ` • ${quote.totalCost} ${quote.currency}`}
                  </p>
                </div>
                <Link
                  href={`/quotations/${quote.id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        {/* Recent Activities */}
        <DashboardWidget
          title="Recent Activities"
          href="/activities"
          isEmpty={recentActivities.length === 0}
          emptyMessage="No recent activities"
        >
          <ul className="space-y-3">
            {recentActivities.map((activity: RecentActivity) => (
              <li key={activity.id} className="flex items-start gap-3">
                <Activity className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {activityTypeLabels[activity.type] || activity.type}
                    {activity.subject && `: ${activity.subject}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.userName}
                    {activity.customerName && ` • ${activity.customerName}`}
                    {" • "}{formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardWidget>
      </div>
    </div>
  );
}
