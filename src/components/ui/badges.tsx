import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CustomerStatus, Potential } from '@/types/index.js';

interface StatusBadgeProps {
  status: CustomerStatus;
  className?: string;
}

const statusStyles: Record<CustomerStatus, string> = {
  Aktif: 'bg-green-100 text-green-800',
  Pasif: 'bg-gray-100 text-gray-800',
  Soguk: 'bg-blue-100 text-blue-800',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}

interface PotentialBadgeProps {
  potential: Potential;
  className?: string;
}

const potentialStyles: Record<Potential, string> = {
  Dusuk: 'bg-red-100 text-red-800',
  Orta: 'bg-yellow-100 text-yellow-800',
  Yuksek: 'bg-green-100 text-green-800',
};

export function PotentialBadge({ potential, className }: PotentialBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        potentialStyles[potential],
        className
      )}
    >
      {potential}
    </span>
  );
}

interface ActivityTypeBadgeProps {
  type: string;
  className?: string;
}

export function ActivityTypeBadge({ type, className }: ActivityTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800',
        className
      )}
    >
      {type}
    </span>
  );
}

interface OutcomeBadgeProps {
  outcome: string;
  className?: string;
}

const outcomeStyles: Record<string, string> = {
  Olumlu: 'bg-green-100 text-green-800',
  Notr: 'bg-gray-100 text-gray-800',
  Olumsuz: 'bg-red-100 text-red-800',
  'Teklif Istendi': 'bg-blue-100 text-blue-800',
};

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        outcomeStyles[outcome] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {outcome}
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
