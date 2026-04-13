import { Badge } from '@/components/ui';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Color mapping for status values:
 * Aktif = emerald, Pasif = slate, Soguk = blue, Bekliyor = amber,
 * Kazanildi = emerald, Kaybedildi = red
 * Potential levels:
 * Yuksek Oncelikli = amber, Orta = info/blue, Dusuk = slate
 */
const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Customer statuses
  Aktif: 'success',
  aktif: 'success',
  Pasif: 'neutral',
  pasif: 'neutral',
  Soguk: 'info',
  soguk: 'info',
  Bekliyor: 'warning',
  bekliyor: 'warning',
  Kazanildi: 'success',
  kazanildi: 'success',
  Kaybedildi: 'danger',
  kaybedildi: 'danger',

  // Potential levels
  'Yuksek Oncelikli': 'warning',
  'yuksek_oncelikli': 'warning',
  'Yuksek': 'warning',
  'yuksek': 'warning',
  Orta: 'info',
  orta: 'info',
  Dusuk: 'neutral',
  dusuk: 'neutral',

  // Quote statuses
  Hazirlaniyor: 'warning',
  hazirlaniyor: 'warning',
  Gonderildi: 'info',
  gonderildi: 'info',
  Revize: 'warning',
  revize: 'warning',
};

function getVariant(status: string): BadgeVariant {
  return STATUS_VARIANT_MAP[status] || 'neutral';
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)} className={className}>
      {status}
    </Badge>
  );
}
