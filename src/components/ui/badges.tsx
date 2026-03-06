import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CustomerStatus, Potential } from '@/types/index.js';
import type { QuoteStatus } from '@/types/quotations';

type StatusType = CustomerStatus | QuoteStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  Aktif: 'bg-green-100 text-green-800',
  Pasif: 'bg-gray-100 text-gray-800',
  Soguk: 'bg-blue-100 text-blue-800',
  Bekliyor: 'bg-yellow-100 text-yellow-800',
  Kazanildi: 'bg-green-100 text-green-800',
  Kaybedildi: 'bg-red-100 text-red-800',
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
