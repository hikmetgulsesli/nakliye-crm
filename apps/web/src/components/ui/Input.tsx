import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Icon name={icon} size="sm" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors duration-150',
              'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              icon ? 'pl-12 pr-4' : 'px-4',
              error && 'border-red-400 focus:ring-red-500/50 focus:border-red-500 dark:border-red-500',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
