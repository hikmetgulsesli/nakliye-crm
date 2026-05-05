import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  /** 5'ten fazla secenek varsa varsayilan olarak acik */
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Bos secenegi gostermek icin label (ornegin "Seciniz"). Verilirse listede ilk satir bu olur. */
  emptyLabel?: string;
}

const TR_FOLD: Record<string, string> = {
  ş: 's', Ş: 's',
  ı: 'i', İ: 'i',
  ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u',
  ö: 'o', Ö: 'o',
  ç: 'c', Ç: 'c',
};

function foldTr(input: string): string {
  return input
    .toLowerCase()
    .replace(/[şŞıİğĞüÜöÖçÇ]/g, (ch) => TR_FOLD[ch] ?? ch);
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  error,
  className,
  searchable,
  searchPlaceholder = 'Ara...',
  disabled,
  emptyLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable ?? options.length >= 5;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showSearch) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    if (!isOpen) setQuery('');
    return undefined;
  }, [isOpen, showSearch]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const needle = foldTr(query.trim());
    return options.filter((o) => foldTr(o.label).includes(needle));
  }, [options, query]);

  function pick(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
    setQuery('');
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'min-h-[48px] w-full bg-white border rounded-xl px-3 py-2 flex items-center gap-2 transition-colors',
          'dark:bg-slate-900',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer',
          isOpen
            ? 'border-primary ring-2 ring-primary/50'
            : 'border-slate-200 dark:border-slate-700',
          error && 'border-red-400 dark:border-red-500',
        )}
      >
        {selected ? (
          <span className="flex-1 text-sm text-slate-900 dark:text-slate-100 truncate">
            {selected.label}
          </span>
        ) : (
          <span className="flex-1 text-sm text-slate-400 dark:text-slate-500 truncate">
            {placeholder}
          </span>
        )}
        {selected && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Seçimi temizle"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
        <Icon
          name={isOpen ? 'expand_less' : 'expand_more'}
          size="sm"
          className="text-slate-400 dark:text-slate-500 flex-shrink-0"
        />
      </div>

      <div
        className={cn(
          'absolute z-40 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col transition-all duration-150 origin-top',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
        )}
      >
        {showSearch && (
          <div className="border-b border-slate-100 dark:border-slate-800 p-2">
            <div className="relative">
              <Icon
                name="search"
                size="sm"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsOpen(false);
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg pl-8 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}

        <div className="max-h-60 overflow-y-auto">
          {emptyLabel && !query && (
            <button
              type="button"
              onClick={() => pick('')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {emptyLabel}
            </button>
          )}
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">
              Sonuç bulunamadı
            </p>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                    isSelected && 'bg-primary/5',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center size-4 rounded-full transition-colors flex-shrink-0',
                      isSelected ? 'bg-primary text-white' : 'border border-slate-300 dark:border-slate-600',
                    )}
                  >
                    {isSelected && <Icon name="check" size="sm" className="!text-[12px]" />}
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
            })
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
