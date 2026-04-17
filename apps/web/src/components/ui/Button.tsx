import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-primary/20',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-medium dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700',
  ghost:
    'text-slate-600 hover:bg-slate-100 rounded-xl font-medium dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const iconSizeMap: Record<ButtonSize, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon ? (
          <Icon name={icon} size={iconSizeMap[size]} />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
