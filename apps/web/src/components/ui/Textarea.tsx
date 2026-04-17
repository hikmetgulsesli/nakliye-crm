import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 px-4 py-3 min-h-[120px] resize-y transition-colors duration-150',
            'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            error && 'border-red-400 focus:ring-red-500/50 focus:border-red-500 dark:border-red-500',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
