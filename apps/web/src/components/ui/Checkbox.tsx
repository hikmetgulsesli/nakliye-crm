import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className="inline-flex items-center gap-2.5 cursor-pointer select-none"
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer',
            className,
          )}
          {...props}
        />
        {label && (
          <span className="text-sm text-slate-700">{label}</span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
