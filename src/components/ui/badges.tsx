import { cn } from '@/lib/utils';
import type { Potential, CustomerStatus } from '@/types/index';

interface StatusBadgeProps {
  status: CustomerStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    Aktif: 'bg-green-100 text-green-800 border-green-200',
    Pasif: 'bg-gray-100 text-gray-800 border-gray-200',
    Soguk: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status],
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

export function PotentialBadge({ potential, className }: PotentialBadgeProps) {
  const styles = {
    Dusuk: 'bg-gray-100 text-gray-800 border-gray-200',
    Orta: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Yuksek: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    Dusuk: 'Düşük',
    Orta: 'Orta',
    Yuksek: 'Yüksek',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[potential],
        className
      )}
    >
      {labels[potential]}
    </span>
  );
}

interface OutcomeBadgeProps {
  outcome: 'Olumlu' | 'Notr' | 'Olumsuz' | 'Teklif Istendi';
  className?: string;
}

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  const styles = {
    Olumlu: 'bg-green-100 text-green-800 border-green-200',
    Notr: 'bg-gray-100 text-gray-800 border-gray-200',
    Olumsuz: 'bg-red-100 text-red-800 border-red-200',
    'Teklif Istendi': 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[outcome],
        className
      )}
    >
      {outcome}
    </span>
  );
}

interface ActivityTypeBadgeProps {
  type: 'Telefon' | 'E-posta' | 'Yuz Yuze' | 'Video Gorusme';
  className?: string;
}

export function ActivityTypeBadge({ type, className }: ActivityTypeBadgeProps) {
  const styles = {
    Telefon: 'bg-purple-100 text-purple-800 border-purple-200',
    'E-posta': 'bg-blue-100 text-blue-800 border-blue-200',
    'Yuz Yuze': 'bg-green-100 text-green-800 border-green-200',
    'Video Gorusme': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[type],
        className
      )}
    >
      {type}
    </span>
  );
}

