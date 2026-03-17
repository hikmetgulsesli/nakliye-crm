"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  href?: string;
  badge?: number;
  badgeColor?: "red" | "amber" | "green" | "blue";
  emptyMessage?: string;
  isEmpty?: boolean;
}

const badgeColorClasses = {
  red: "bg-rose-500 text-white",
  amber: "bg-amber-500 text-white",
  green: "bg-emerald-500 text-white",
  blue: "bg-blue-500 text-white",
};

export function DashboardWidget({
  title,
  children,
  href,
  badge,
  badgeColor = "blue",
  emptyMessage = "No items",
  isEmpty = false,
}: DashboardWidgetProps) {
  const content = (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          {badge !== undefined && badge > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        {href && (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="p-4">
        {isEmpty ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
