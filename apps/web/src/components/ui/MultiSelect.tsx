import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seciniz...',
  error,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  function removeOption(optionValue: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  }

  const selectedLabels = options.filter((o) => value.includes(o.value));

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'min-h-[48px] w-full bg-white border rounded-xl px-3 py-2 flex items-center flex-wrap gap-1.5 cursor-pointer transition-colors',
          'dark:bg-slate-900',
          isOpen
            ? 'border-primary ring-2 ring-primary/50'
            : 'border-slate-200 dark:border-slate-700',
          error && 'border-red-400 dark:border-red-500',
        )}
      >
        {selectedLabels.length === 0 ? (
          <span className="text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
        ) : (
          selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-lg px-3 py-1 text-sm font-medium dark:bg-primary/20 dark:text-primary-300"
            >
              {opt.label}
              <button
                onClick={(e) => removeOption(opt.value, e)}
                aria-label={`${opt.label} kaldir`}
                className="hover:text-primary/70 transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto flex-shrink-0">
          <Icon
            name={isOpen ? 'expand_less' : 'expand_more'}
            size="sm"
            className="text-slate-400 dark:text-slate-500"
          />
        </div>
      </div>

      {/* Dropdown list */}
      <div
        className={cn(
          'absolute z-40 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto transition-all duration-150 origin-top',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
        )}
      >
        {options.map((opt) => {
          const isSelected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleOption(opt.value)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div
                className={cn(
                  'flex items-center justify-center size-5 rounded border transition-colors flex-shrink-0',
                  isSelected
                    ? 'bg-primary border-primary text-white'
                    : 'border-slate-300 dark:border-slate-600',
                )}
              >
                {isSelected && <Icon name="check" size="sm" />}
              </div>
              <span
                className={cn(
                  'text-slate-700 dark:text-slate-200',
                  isSelected && 'font-medium',
                )}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
