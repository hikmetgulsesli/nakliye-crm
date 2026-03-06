import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CustomerStatus, Potential } from '@/types/index.js';

// Status Badge
const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        Aktif: "bg-green-100 text-green-800",
        Pasif: "bg-gray-100 text-gray-800",
        Soguk: "bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      status: "Aktif",
    },
  }
);

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof statusBadgeVariants> {
  status: CustomerStatus;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {status}
    </span>
  );
}

// Potential Badge
const potentialBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      potential: {
        Dusuk: "bg-red-100 text-red-800",
        Orta: "bg-yellow-100 text-yellow-800",
        Yuksek: "bg-green-100 text-green-800",
      },
    },
    defaultVariants: {
      potential: "Orta",
    },
  }
);

interface PotentialBadgeProps extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof potentialBadgeVariants> {
  potential: Potential;
}

export function PotentialBadge({ potential, className, ...props }: PotentialBadgeProps) {
  return (
    <span
      className={cn(potentialBadgeVariants({ potential }), className)}
      {...props}
    >
      {potential}
    </span>
  );
}

// Activity Type Badge
const activityTypeBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      type: {
        Telefon: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
        'E-posta': "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
        'Yuz Yuze': "bg-green-50 text-green-700 ring-1 ring-green-600/20",
        'Video Gorusme': "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
      },
    },
    defaultVariants: {
      type: "Telefon",
    },
  }
);

interface ActivityTypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: 'Telefon' | 'E-posta' | 'Yuz Yuze' | 'Video Gorusme' | string;
}

export function ActivityTypeBadge({ type, className, ...props }: ActivityTypeBadgeProps) {
  const typeMap: Record<string, string> = {
    Telefon: 'Telefon',
    'E-posta': 'E-posta',
    'Yuz Yuze': 'Yüz Yüze',
    'Video Gorusme': 'Video Görüşme',
  };

  return (
    <span
      className={cn(activityTypeBadgeVariants({ type: type as 'Telefon' | 'E-posta' | 'Yuz Yuze' | 'Video Gorusme' }), className)}
      {...props}
    >
      {typeMap[type] || type}
    </span>
  );
}

// Outcome Badge
const outcomeBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      outcome: {
        Olumlu: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
        Notr: "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20",
        Olumsuz: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
        'Teklif Istendi': "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
      },
    },
    defaultVariants: {
      outcome: "Notr",
    },
  }
);

interface OutcomeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  outcome: 'Olumlu' | 'Notr' | 'Olumsuz' | 'Teklif Istendi' | string;
}

export function OutcomeBadge({ outcome, className, ...props }: OutcomeBadgeProps) {
  const outcomeMap: Record<string, string> = {
    Olumlu: 'Olumlu',
    Notr: 'Nötr',
    Olumsuz: 'Olumsuz',
    'Teklif Istendi': 'Teklif İstendi',
  };

  return (
    <span
      className={cn(outcomeBadgeVariants({ outcome: outcome as 'Olumlu' | 'Notr' | 'Olumsuz' | 'Teklif Istendi' }), className)}
      {...props}
    >
      {outcomeMap[outcome] || outcome}
    </span>
  );
}
