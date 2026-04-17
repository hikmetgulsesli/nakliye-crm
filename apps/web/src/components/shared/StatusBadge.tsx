import { Badge } from '@/components/ui';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Color mapping for status values:
 * Aktif = emerald, Pasif = slate, Soğuk = blue, Bekliyor = amber,
 * Kazanıldı = emerald, Kaybedildi = red
 * Potential levels:
 * Yüksek Oncelikli = amber, Orta = info/blue, Düşük = slate
 */
const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Customer statuses
  Aktif: 'success',
  aktif: 'success',
  Pasif: 'neutral',
  pasif: 'neutral',
  Soğuk: 'info',
  soğuk: 'info',
  Bekliyor: 'warning',
  bekliyor: 'warning',
  Kazanıldı: 'success',
  kazanıldı: 'success',
  Kaybedildi: 'danger',
  kaybedildi: 'danger',

  // Potential levels
  'Yüksek Oncelikli': 'warning',
  'yuksek_oncelikli': 'warning',
  'Yüksek': 'warning',
  'yüksek': 'warning',
  Orta: 'info',
  orta: 'info',
  Düşük: 'neutral',
  düşük: 'neutral',

  // Quote statuses
  Hazirlaniyor: 'warning',
  hazirlaniyor: 'warning',
  Gönderildi: 'info',
  gönderildi: 'info',
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
