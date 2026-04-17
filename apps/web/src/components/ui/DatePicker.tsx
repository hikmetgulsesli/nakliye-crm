import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, id, ...props }, ref) => {
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon name="calendar_today" size="sm" />
          </div>
          <input
            ref={ref}
            id={inputId}
            type="date"
            className={cn(
              'w-full h-12 bg-white border border-slate-200 rounded-xl text-slate-900 pl-12 pr-4 transition-colors duration-150',
              'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:[color-scheme:dark]',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              error && 'border-red-400 focus:ring-red-500/50 focus:border-red-500 dark:border-red-500',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
