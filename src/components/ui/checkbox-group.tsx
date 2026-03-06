import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  className,
  disabled = false,
}: CheckboxGroupProps) {
  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {options.map((opt) => {
        const isSelected = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isSelected && 'border-primary bg-primary/5 text-primary',
              !isSelected && 'border-input bg-background',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="checkbox"
              value={opt.value}
              checked={isSelected}
              onChange={() => toggleOption(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input'
              )}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </div>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
