export type ShipmentStatus =
  | 'draft'
  | 'booked'
  | 'loading'
  | 'in_transit'
  | 'at_destination'
  | 'customs_cleared'
  | 'delivered'
  | 'cancelled';

export const SHIPMENT_STATUSES: readonly ShipmentStatus[] = [
  'draft',
  'booked',
  'loading',
  'in_transit',
  'at_destination',
  'customs_cleared',
  'delivered',
  'cancelled',
] as const;

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  draft: 'Taslak',
  booked: 'Rezerve',
  loading: 'Yükleme',
  in_transit: 'Transit',
  at_destination: 'Varışta',
  customs_cleared: 'Gümrük OK',
  delivered: 'Teslim',
  cancelled: 'İptal',
};

/**
 * Hangi statusten hangisine gecis izinli.
 */
const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ['booked', 'cancelled'],
  booked: ['loading', 'cancelled'],
  loading: ['in_transit', 'cancelled'],
  in_transit: ['at_destination', 'cancelled'],
  at_destination: ['customs_cleared', 'cancelled'],
  customs_cleared: ['delivered', 'cancelled'],
  delivered: [], // final
  cancelled: [], // final
};

export function canTransition(from: string, to: string): boolean {
  if (!(from in TRANSITIONS)) return false;
  return TRANSITIONS[from as ShipmentStatus].includes(to as ShipmentStatus);
}

export function allowedNextStatuses(current: string): ShipmentStatus[] {
  if (!(current in TRANSITIONS)) return [];
  return TRANSITIONS[current as ShipmentStatus];
}

export function isValidStatus(s: string): s is ShipmentStatus {
  return (SHIPMENT_STATUSES as readonly string[]).includes(s);
}
