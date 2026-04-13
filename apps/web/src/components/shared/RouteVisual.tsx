import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

/** Country code to flag emoji mapping (common countries for logistics) */
const COUNTRY_FLAGS: Record<string, string> = {
  TR: '\u{1F1F9}\u{1F1F7}',
  CN: '\u{1F1E8}\u{1F1F3}',
  US: '\u{1F1FA}\u{1F1F8}',
  DE: '\u{1F1E9}\u{1F1EA}',
  GB: '\u{1F1EC}\u{1F1E7}',
  FR: '\u{1F1EB}\u{1F1F7}',
  IT: '\u{1F1EE}\u{1F1F9}',
  ES: '\u{1F1EA}\u{1F1F8}',
  NL: '\u{1F1F3}\u{1F1F1}',
  BE: '\u{1F1E7}\u{1F1EA}',
  JP: '\u{1F1EF}\u{1F1F5}',
  KR: '\u{1F1F0}\u{1F1F7}',
  IN: '\u{1F1EE}\u{1F1F3}',
  AE: '\u{1F1E6}\u{1F1EA}',
  SA: '\u{1F1F8}\u{1F1E6}',
  RU: '\u{1F1F7}\u{1F1FA}',
  BR: '\u{1F1E7}\u{1F1F7}',
  EG: '\u{1F1EA}\u{1F1EC}',
  GR: '\u{1F1EC}\u{1F1F7}',
  UA: '\u{1F1FA}\u{1F1E6}',
  PL: '\u{1F1F5}\u{1F1F1}',
  RO: '\u{1F1F7}\u{1F1F4}',
  BG: '\u{1F1E7}\u{1F1EC}',
  GE: '\u{1F1EC}\u{1F1EA}',
  IL: '\u{1F1EE}\u{1F1F1}',
  SG: '\u{1F1F8}\u{1F1EC}',
  MY: '\u{1F1F2}\u{1F1FE}',
  TH: '\u{1F1F9}\u{1F1ED}',
  VN: '\u{1F1FB}\u{1F1F3}',
  AU: '\u{1F1E6}\u{1F1FA}',
  CA: '\u{1F1E8}\u{1F1E6}',
};

const TRANSPORT_ICONS: Record<string, string> = {
  deniz: 'directions_boat',
  hava: 'flight',
  kara: 'local_shipping',
  demiryolu: 'train',
  sea: 'directions_boat',
  air: 'flight',
  road: 'local_shipping',
  rail: 'train',
};

function getFlag(countryCode?: string | null): string {
  if (!countryCode) return '\u{1F3F3}\u{FE0F}';
  const upper = countryCode.toUpperCase();
  return COUNTRY_FLAGS[upper] || '\u{1F3F3}\u{FE0F}';
}

function getTransportIcon(mode?: string | null): string {
  if (!mode) return 'swap_horiz';
  return TRANSPORT_ICONS[mode.toLowerCase()] || 'swap_horiz';
}

interface RouteVisualProps {
  originCountry?: string | null;
  pol?: string | null;
  destinationCountry?: string | null;
  pod?: string | null;
  transportMode?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RouteVisual({
  originCountry,
  pol,
  destinationCountry,
  pod,
  transportMode,
  size = 'md',
  className,
}: RouteVisualProps) {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Origin */}
      <div className={cn('flex items-center gap-1.5 min-w-0', isSm && 'gap-1')}>
        <span className={cn('text-base', isLg && 'text-xl', isSm && 'text-sm')}>
          {getFlag(originCountry)}
        </span>
        <span
          className={cn(
            'font-semibold text-slate-700 truncate',
            isLg ? 'text-base' : isSm ? 'text-xs' : 'text-sm',
          )}
        >
          {pol || '-'}
        </span>
      </div>

      {/* Connecting line with transport icon */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className={cn('h-0.5 bg-blue-400 rounded-full', isLg ? 'w-8' : isSm ? 'w-3' : 'w-5')} />
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-blue-50 text-blue-600',
            isLg ? 'size-8' : isSm ? 'size-5' : 'size-6',
          )}
        >
          <Icon
            name={getTransportIcon(transportMode)}
            size={isLg ? 'sm' : 'sm'}
            className={cn(isSm && '!text-[14px]')}
          />
        </div>
        <div className={cn('h-0.5 bg-blue-400 rounded-full', isLg ? 'w-8' : isSm ? 'w-3' : 'w-5')} />
      </div>

      {/* Destination */}
      <div className={cn('flex items-center gap-1.5 min-w-0', isSm && 'gap-1')}>
        <span className={cn('text-base', isLg && 'text-xl', isSm && 'text-sm')}>
          {getFlag(destinationCountry)}
        </span>
        <span
          className={cn(
            'font-semibold text-slate-700 truncate',
            isLg ? 'text-base' : isSm ? 'text-xs' : 'text-sm',
          )}
        >
          {pod || '-'}
        </span>
      </div>
    </div>
  );
}
