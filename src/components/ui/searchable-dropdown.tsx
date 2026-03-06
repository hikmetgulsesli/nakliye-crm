"use client"

import * as React from "react"
import { ChevronDown, Search, X, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface SearchableDropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SearchableDropdownProps {
  options?: SearchableDropdownOption[]
  value?: string | null
  onChange: (value: string | null) => void
  onSearch?: (query: string) => Promise<SearchableDropdownOption[]> | SearchableDropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  debounceMs?: number
  clearable?: boolean
  virtualScroll?: boolean
  virtualItemHeight?: number
  maxHeight?: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function SearchableDropdown({
  options: initialOptions = [],
  value,
  onChange,
  onSearch,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  label,
  disabled = false,
  loading: externalLoading = false,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  debounceMs = 300,
  clearable = true,
  virtualScroll = false,
  virtualItemHeight = 40,
  maxHeight = 240,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [options, setOptions] = React.useState<SearchableDropdownOption[]>(initialOptions)
  const [internalLoading, setInternalLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listboxRef = React.useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 50 })

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs)
  const loading = externalLoading || internalLoading

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  )

  // Load options when search query changes (debounced)
  React.useEffect(() => {
    const loadOptions = async () => {
      if (!onSearch) {
        // Client-side filtering
        if (!debouncedSearchQuery.trim()) {
          setOptions(initialOptions)
        } else {
          const query = debouncedSearchQuery.toLowerCase()
          setOptions(
            initialOptions.filter((opt) =>
              opt.label.toLowerCase().includes(query)
            )
          )
        }
        return
      }

      setInternalLoading(true)
      try {
        const result = await onSearch(debouncedSearchQuery)
        setOptions(result)
      } catch (error) {
        console.error("Failed to load options:", error)
        setOptions([])
      } finally {
        setInternalLoading(false)
      }
    }

    loadOptions()
  }, [debouncedSearchQuery, onSearch, initialOptions])

  // Virtual scrolling calculations
  const visibleOptions = React.useMemo(() => {
    if (!virtualScroll) return options
    return options.slice(visibleRange.start, visibleRange.end)
  }, [options, virtualScroll, visibleRange])

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!virtualScroll) return
    
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const start = Math.floor(scrollTop / virtualItemHeight)
    const visibleCount = Math.ceil(maxHeight / virtualItemHeight)
    const end = Math.min(start + visibleCount + 5, options.length)
    
    setVisibleRange({ start: Math.max(0, start - 2), end })
  }, [virtualScroll, virtualItemHeight, maxHeight, options.length])

  const handleSelect = React.useCallback((optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery("")
  }, [onChange])

  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          containerRef.current?.focus()
          break
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev + 1
            return next >= options.length ? 0 : next
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? options.length - 1 : next
          })
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            const option = options[focusedIndex]
            if (!option.disabled) {
              handleSelect(option.value)
            }
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedIndex(options.length - 1)
          break
      }
    }

    const element = containerRef.current
    if (element) {
      element.addEventListener("keydown", handleKeyDown)
      return () => element.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, options, focusedIndex, handleSelect])

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
      setFocusedIndex(-1)
    } else {
      setSearchQuery("")
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Scroll focused option into view
  React.useEffect(() => {
    if (focusedIndex >= 0 && listboxRef.current && !virtualScroll) {
      const optionElement = listboxRef.current.children[focusedIndex] as HTMLElement
      optionElement?.scrollIntoView({ block: "nearest" })
    }
  }, [focusedIndex, virtualScroll])

  const generatedId = React.useId()
  const uniqueId = id || generatedId
  const listboxId = `${uniqueId}-listbox`
  const labelId = `${uniqueId}-label`

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={isOpen ? listboxId : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy || (label ? labelId : undefined)}
      aria-disabled={disabled}
    >
      {label && (
        <label
          id={labelId}
          className="block text-sm font-medium mb-1.5 text-foreground"
        >
          {label}
        </label>
      )}

      <Button
        type="button"
        variant="outline"
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between h-10 px-3",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {clearable && selectedOption && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={handleClear}
              className="cursor-pointer hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-0.5"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </div>
      </Button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md"
          role="presentation"
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                aria-label="Search options"
              />
              {loading && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel || label || "Options"}
            onScroll={handleScroll}
            className="overflow-auto p-1"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {loading && options.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              <>
                {virtualScroll && (
                  <div style={{ height: `${options.length * virtualItemHeight}px`, position: "relative" }}>
                    <div style={{ transform: `translateY(${visibleRange.start * virtualItemHeight}px)` }}>
                      {visibleOptions.map((option, index) => {
                        const actualIndex = visibleRange.start + index
                        const isSelected = value === option.value
                        const isFocused = actualIndex === focusedIndex

                        return (
                          <div
                            key={option.value}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={option.disabled}
                            tabIndex={-1}
                            onClick={() => !option.disabled && handleSelect(option.value)}
                            onMouseEnter={() => setFocusedIndex(actualIndex)}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 text-sm outline-none",
                              isFocused && "bg-accent text-accent-foreground",
                              isSelected && "font-medium bg-primary/10",
                              option.disabled && "pointer-events-none opacity-50"
                            )}
                            style={{ height: `${virtualItemHeight}px` }}
                          >
                            {option.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {!virtualScroll && options.map((option, index) => {
                  const isSelected = value === option.value
                  const isFocused = index === focusedIndex

                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      tabIndex={-1}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none",
                        isFocused && "bg-accent text-accent-foreground",
                        isSelected && "font-medium bg-primary/10",
                        option.disabled && "pointer-events-none opacity-50"
                      )}
                    >
                      {option.label}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* Screen reader announcement */}
      <span className="sr-only" role="status" aria-live="polite">
        {selectedOption ? `${selectedOption.label} selected` : "No selection"}
      </span>
    </div>
  )
}
