import * as React from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SearchableDropdownProps {
  options?: SearchableDropdownOption[];
  value?: string | null;
  onChange: (value: string | null, option?: SearchableDropdownOption) => void;
  onSearch?: (query: string) => void | Promise<void>;
  loadOptions?: (query: string) => Promise<SearchableDropdownOption[]>;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  debounceMs?: number;
  maxHeight?: number;
  virtualScroll?: boolean;
  virtualItemHeight?: number;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
}

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Virtual list hook
function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const virtualItems = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        left: 0,
        right: 0,
      },
    }));
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  return { virtualItems, totalHeight, setScrollTop };
}

export function SearchableDropdown({
  options: initialOptions = [],
  value,
  onChange,
  onSearch,
  loadOptions,
  placeholder = 'Seçiniz...',
  searchPlaceholder = 'Ara...',
  className,
  disabled = false,
  clearable = true,
  debounceMs = 300,
  maxHeight = 300,
  virtualScroll = false,
  virtualItemHeight = 40,
  loading: externalLoading = false,
  emptyMessage = 'Seçenek yok',
  noResultsMessage = 'Sonuç bulunamadı',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [options, setOptions] = React.useState<SearchableDropdownOption[]>(initialOptions);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const debouncedSearch = useDebounce(search, debounceMs);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Load options when debounced search changes
  React.useEffect(() => {
    if (!isOpen) return;

    async function fetchOptions() {
      if (loadOptions) {
        setIsLoading(true);
        try {
          const newOptions = await loadOptions(debouncedSearch);
          setOptions(newOptions);
        } catch (error) {
          console.error('Failed to load options:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (onSearch) {
        setIsLoading(true);
        try {
          await onSearch(debouncedSearch);
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchOptions();
  }, [debouncedSearch, loadOptions, onSearch, isOpen]);

  // Sync external options when not using async loading
  React.useEffect(() => {
    if (!loadOptions && !onSearch) {
      setOptions(initialOptions);
    }
  }, [initialOptions, loadOptions, onSearch]);

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (loadOptions || onSearch) return options;
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, search, loadOptions, onSearch]);

  const handleSelect = (option: SearchableDropdownOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? filteredOptions.length - 1 : next;
          });
        }
        break;
      case 'Home':
        e.preventDefault();
        if (isOpen) setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (isOpen) setActiveIndex(filteredOptions.length - 1);
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  const listboxId = id ? `${id}-listbox` : undefined;
  const triggerId = id ? `${id}-trigger` : undefined;

  const { virtualItems, totalHeight, setScrollTop } = useVirtualList(
    filteredOptions,
    virtualItemHeight,
    maxHeight,
    5
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'ring-2 ring-ring ring-offset-2'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-controls={isOpen ? listboxId : undefined}
      >
        <span className={cn('flex-1 truncate text-left', !selectedOption && 'text-muted-foreground')}>
          {selectedOption?.label || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <span
              onClick={handleClear}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full hover:bg-muted"
              role="button"
              aria-label="Seçimi temizle"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </span>
          )}
          {(isLoading || externalLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 opacity-50 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-sm border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                aria-label="Seçeneklerde ara"
              />
            </div>
          </div>

          <div
            className="overflow-auto p-1"
            style={{ maxHeight, position: 'relative' }}
            onScroll={virtualScroll ? handleScroll : undefined}
          >
            {(isLoading || externalLoading) && filteredOptions.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {search ? noResultsMessage : emptyMessage}
              </div>
            ) : virtualScroll ? (
              <div style={{ height: totalHeight, position: 'relative' }}>
                {virtualItems.map(({ item: opt, style }) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      style={style}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent',
                        opt.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1 truncate">{opt.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent',
                      isActive && 'bg-accent/80',
                      opt.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex-1 truncate">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableDropdown;
