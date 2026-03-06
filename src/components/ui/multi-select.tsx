import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  selectNoneLabel?: string;
  maxHeight?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  searchable = true,
  className,
  disabled = false,
  showSelectAll = true,
  selectAllLabel = 'Tümünü Seç',
  selectNoneLabel = 'Seçimi Temizle',
  maxHeight = 240,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);

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
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [options, search, searchable]);

  const selectedOptions = React.useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  const enabledOptions = React.useMemo(() => {
    return filteredOptions.filter((opt) => !opt.disabled);
  }, [filteredOptions]);

  const allEnabledSelected = enabledOptions.length > 0 && enabledOptions.every((opt) => value.includes(opt.value));

  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    const option = options.find((o) => o.value === optionValue);
    if (option?.disabled) return;
    
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectAll = () => {
    if (disabled) return;
    const enabledValues = enabledOptions.map((opt) => opt.value);
    onChange(enabledValues);
  };

  const selectNone = () => {
    if (disabled) return;
    onChange([]);
  };

  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((v) => v !== optionValue));
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
          toggleOption(filteredOptions[activeIndex].value);
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
    }
  };

  const listboxId = id ? `${id}-listbox` : undefined;
  const triggerId = id ? `${id}-trigger` : undefined;

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
        <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                data-testid="selected-badge"
              >
                {opt.label}
                <span
                  onClick={(e) => removeOption(e, opt.value)}
                  className="cursor-pointer hover:text-primary/70"
                  role="button"
                  aria-label={`${opt.label} seçimini kaldır`}
                  tabIndex={-1}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-50 transition-transform',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          {searchable && (
            <div className="border-b p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="h-8 w-full rounded-sm border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                aria-label="Seçeneklerde ara"
              />
            </div>
          )}

          {showSelectAll && enabledOptions.length > 0 && (
            <div className="flex items-center gap-2 border-b p-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={allEnabledSelected}
                className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={selectAllLabel}
              >
                {selectAllLabel}
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={selectNone}
                disabled={value.length === 0}
                className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={selectNoneLabel}
              >
                {selectNoneLabel}
              </button>
            </div>
          )}

          <div
            className="overflow-auto p-1"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                Sonuç bulunamadı
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = value.includes(opt.value);
                const isActive = index === activeIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => !opt.disabled && toggleOption(opt.value)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent',
                      isActive && 'bg-accent/80',
                      opt.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{opt.label}</span>
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

export default MultiSelect;
