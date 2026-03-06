"use client"

import * as React from "react"
import { Check, ChevronDown, X, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  label,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listboxRef = React.useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  )

  const allSelected = filteredOptions.length > 0 && 
    filteredOptions.every((opt) => value.includes(opt.value) || opt.disabled)
  const someSelected = filteredOptions.some((opt) => value.includes(opt.value)) && !allSelected

  const handleSelectAll = React.useCallback(() => {
    const selectableFiltered = filteredOptions.filter((opt) => !opt.disabled)
    if (allSelected) {
      const filteredValues = new Set(filteredOptions.map((o) => o.value))
      onChange(value.filter((v) => !filteredValues.has(v)))
    } else {
      const newValues = new Set(value)
      selectableFiltered.forEach((opt) => newValues.add(opt.value))
      onChange(Array.from(newValues))
    }
  }, [filteredOptions, value, onChange, allSelected])

  const handleToggle = React.useCallback((optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }, [value, onChange])

  const handleRemove = React.useCallback((optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }, [value, onChange])

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
            return next >= filteredOptions.length ? 0 : next
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? filteredOptions.length - 1 : next
          })
          break
        case "Enter":
        case " ":
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const option = filteredOptions[focusedIndex]
            if (!option.disabled) {
              handleToggle(option.value)
            }
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedIndex(filteredOptions.length - 1)
          break
      }
    }

    const element = containerRef.current
    if (element) {
      element.addEventListener("keydown", handleKeyDown)
      return () => element.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, filteredOptions, focusedIndex, handleToggle])

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
    if (focusedIndex >= 0 && listboxRef.current) {
      const optionElement = listboxRef.current.children[focusedIndex] as HTMLElement
      optionElement?.scrollIntoView({ block: "nearest" })
    }
  }, [focusedIndex])

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
          "w-full justify-between h-auto min-h-[40px] px-3 py-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex flex-wrap gap-1 items-center flex-1 overflow-hidden">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-0.5 text-xs"
              >
                {option.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${option.label}`}
                  onClick={(e) => handleRemove(option.value, e)}
                  className="cursor-pointer hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 ml-2 transition-transform", isOpen && "rotate-180")} />
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
            </div>
          </div>

          {filteredOptions.length > 0 && (
            <div className="p-2 border-b">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="w-full justify-start text-sm"
                aria-pressed={allSelected}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                    allSelected && "bg-primary border-primary",
                    someSelected && "bg-primary/50 border-primary"
                  )}
                >
                  {(allSelected || someSelected) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>
          )}

          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={ariaLabel || label || "Options"}
            className="max-h-[240px] overflow-auto p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option.value)
                const isFocused = index === focusedIndex

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    tabIndex={-1}
                    onClick={() => !option.disabled && handleToggle(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none",
                      isFocused && "bg-accent text-accent-foreground",
                      isSelected && "font-medium",
                      option.disabled && "pointer-events-none opacity-50"
                    )}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded border border-primary">
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </span>
                    {option.label}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Screen reader announcement for selection count */}
      <span className="sr-only" role="status" aria-live="polite">
        {selectedOptions.length} options selected
      </span>
    </div>
  )
}
