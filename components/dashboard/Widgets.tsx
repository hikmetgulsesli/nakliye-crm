"use client";

import Link from "next/link";
import { Calendar, Phone, FileText, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { formatDate, formatRelativeTime, getActivityTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils/formatters";

interface FollowUp {
  id: string;
  type: string;
  subject: string | null;
  dueDate: string | null;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

interface UpcomingFollowUpsProps {
  followUps: FollowUp[];
}

export function UpcomingFollowUpsWidget({ followUps }: UpcomingFollowUpsProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Yaklaşan Takipler</h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{followUps.length}</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {followUps.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Yaklaşan takip yok
          </div>
        ) : (
          followUps.map((followUp) => (
            <Link
              key={followUp.id}
              href={`/customers/${followUp.customer?.id}`}
              className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {followUp.customer?.companyName || "Müşteri Yok"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {getActivityTypeLabel(followUp.type)}
                    {followUp.subject && ` - ${followUp.subject}`}
                  </p>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {followUp.dueDate ? formatDate(followUp.dueDate) : "Tarih yok"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

interface CustomerToCall {
  id: string;
  companyName: string;
  totalActivities: number;
}

interface CustomersToCallWidgetProps {
  customers: CustomerToCall[];
}

export function CustomersToCallWidget({ customers }: CustomersToCallWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Aranması Gerekenler</h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{customers.length}</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {customers.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Tüm müşteriler güncel
          </div>
        ) : (
          customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{customer.companyName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {customer.totalActivities > 0
                      ? `${customer.totalActivities} aktivite kaydı`
                      : "Henüz görüşme yapılmamış"}
                  </p>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

interface PendingQuote {
  id: string;
  quoteNumber: string;
  status: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
  } | null;
}

interface PendingQuotesWidgetProps {
  quotes: PendingQuote[];
}

export function PendingQuotesWidget({ quotes }: PendingQuotesWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Bekleyen Teklifler</h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{quotes.length}</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {quotes.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Bekleyen teklif yok
          </div>
        ) : (
          quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/quotations/${quote.id}`}
              className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{quote.quoteNumber}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {quote.customer?.companyName || "Müşteri Yok"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Son güncelleme: {formatRelativeTime(quote.updatedAt)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

interface RecentActivity {
  id: string;
  type: string;
  subject: string | null;
  description: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
  } | null;
  userName: string;
}

interface RecentActivitiesWidgetProps {
  activities: RecentActivity[];
}

export function RecentActivitiesWidget({ activities }: RecentActivitiesWidgetProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL":
        return <Phone className="w-4 h-4" />;
      case "EMAIL":
        return <FileText className="w-4 h-4" />;
      case "MEETING":
        return <Calendar className="w-4 h-4" />;
      case "QUOTE_ACCEPTED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Son Aktiviteler</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Henüz aktivite kaydı yok
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {activity.userName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {getActivityTypeLabel(activity.type)}
                    </span>
                    {activity.customer && (
                      <Link
                        href={`/customers/${activity.customer.id}`}
                        className="text-primary hover:underline truncate"
                      >
                        {activity.customer.companyName}
                      </Link>
                    )}
                  </div>
                  {activity.subject && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {activity.subject}
                    </p>
                  )}
                  {activity.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
