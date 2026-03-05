import * as React from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        Aktif: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
        active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
        Pasif: "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20",
        inactive: "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20",
        Soguk: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
        cold: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "Aktif" | "Pasif" | "Soguk" | "active" | "inactive" | "cold" | string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusMap: Record<string, string> = {
    Aktif: "Aktif",
    active: "Aktif",
    Pasif: "Pasif",
    inactive: "Pasif",
    Soguk: "Soğuk",
    cold: "Soğuk",
  };

  return (
    <span
      className={cn(statusBadgeVariants({ status: status as "Aktif" | "active" | "Pasif" | "inactive" | "Soguk" | "cold" }), className)}
      {...props}
    >
      {statusMap[status] || status}
    </span>
  );
}

const potentialBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      potential: {
        Yuksek: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        high: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        Orta: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
        medium: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
        Dusuk: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-600/20",
        low: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-600/20",
      },
    },
    defaultVariants: {
      potential: "medium",
    },
  }
);

interface PotentialBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  potential: "Yuksek" | "Orta" | "Dusuk" | "high" | "medium" | "low" | string | null;
}

export function PotentialBadge({ potential, className, ...props }: PotentialBadgeProps) {
  if (!potential) return <span className="text-muted-foreground">-</span>;

  const potentialMap: Record<string, string> = {
    Yuksek: "Yüksek",
    high: "Yüksek",
    Orta: "Orta",
    medium: "Orta",
    Dusuk: "Düşük",
    low: "Düşük",
  };

  return (
    <span
      className={cn(
        potentialBadgeVariants({
          potential: potential as "Yuksek" | "high" | "Orta" | "medium" | "Dusuk" | "low",
        }),
        className
      )}
      {...props}
    >
      {potentialMap[potential] || potential}
    </span>
  );
}
