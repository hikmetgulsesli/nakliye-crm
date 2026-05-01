import { Fragment, useState } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui';

export interface InlineEditOption {
  value: string;
  label: string;
  /** Renkli pill için Tailwind class — verilmezse default subtle */
  pillClass?: string;
}

interface InlineEditSelectProps {
  value: string;
  options: InlineEditOption[];
  /** Değişiklik kaydedildiğinde çağrılır. Hata fırlatırsa eski değer korunur. */
  onSave: (next: string) => Promise<void>;
  /** Pasifse görünüm aynı, tıklanmaz */
  disabled?: boolean;
  /** Etiket metnini özel render etmek için */
  renderLabel?: (option: InlineEditOption | undefined, raw: string) => React.ReactNode;
  className?: string;
}

/**
 * Tablo hücresinde tıklanan select. Değer değiştiğinde optimistic update,
 * API hata fırlatırsa eski değere geri döner.
 *
 *  ┌─────────────┐
 *  │ Bekliyor  ▾ │  → click açar
 *  └─────────────┘
 *      └─ Bekliyor ✓
 *         Kazanıldı
 *         Kaybedildi
 */
export function InlineEditSelect({
  value,
  options,
  onSave,
  disabled,
  renderLabel,
  className,
}: InlineEditSelectProps) {
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = optimistic ?? value;
  const currentOpt = options.find((o) => o.value === current);

  async function handleChange(next: string) {
    if (next === current || disabled) return;
    setOptimistic(next);
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      // Parent state guncellenince props.value yeni deger olacak; optimistic'i sifirla
      setOptimistic(null);
    } catch (err) {
      setOptimistic(null);
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
      window.setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn('relative inline-block', className)} onClick={(e) => e.stopPropagation()}>
      <Listbox value={current} onChange={handleChange} disabled={disabled || saving}>
        <ListboxButton
          className={cn(
            'group inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-left text-[12px] font-medium transition-colors',
            !disabled && 'cursor-pointer hover:border-token-border-strong hover:bg-token-bg-hover',
            disabled && 'cursor-default',
            saving && 'opacity-60',
            currentOpt?.pillClass,
          )}
        >
          {renderLabel ? renderLabel(currentOpt, current) : (currentOpt?.label ?? current)}
          {!disabled && (
            <Icon
              name={saving ? 'progress_activity' : 'expand_more'}
              size="sm"
              className={cn(
                '!text-[13px] opacity-50 group-hover:opacity-100',
                saving && 'animate-spin',
              )}
            />
          )}
        </ListboxButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 translate-y-0.5"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            anchor="bottom start"
            className="z-50 min-w-[140px] origin-top overflow-hidden rounded-md border border-token-border bg-token-bg-elev p-1 shadow-token-lg focus:outline-none [--anchor-gap:4px]"
          >
            {options.map((opt) => (
              <ListboxOption
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] text-token-text data-[focus]:bg-token-bg-hover"
              >
                {({ selected }) => (
                  <>
                    <span className={cn('flex-1', opt.pillClass && 'inline-flex items-center')}>
                      {opt.pillClass ? (
                        <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', opt.pillClass)}>
                          {opt.label}
                        </span>
                      ) : (
                        opt.label
                      )}
                    </span>
                    {selected && <Icon name="check" size="sm" className="!text-[14px] text-brand" />}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </Listbox>
      {error && (
        <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
