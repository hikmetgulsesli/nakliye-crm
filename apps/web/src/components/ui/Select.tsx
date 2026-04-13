import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icon name={icon} size="sm" />
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-12 bg-white border border-slate-200 rounded-xl text-slate-900 appearance-none transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              icon ? 'pl-12 pr-10' : 'pl-4 pr-10',
              error && 'border-red-400 focus:ring-red-500/50 focus:border-red-500',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon name="expand_more" size="sm" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
