import { cn } from '@/utils/cn';

interface IconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  filled?: boolean;
}

const sizeClasses: Record<NonNullable<IconProps['size']>, string> = {
  sm: 'text-[18px]',
  md: 'text-[24px]',
  lg: 'text-[32px]',
  xl: 'text-[40px]',
};

export function Icon({ name, className, size = 'md', filled = false }: IconProps) {
  return (
    <span
      className={cn(
        'material-symbols-outlined select-none leading-none',
        sizeClasses[size],
        filled && 'font-variation-filled',
        className,
      )}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
