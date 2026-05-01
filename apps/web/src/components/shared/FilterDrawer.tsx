import { Fragment, type ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Drawer içeriği — gruplandırılmış filtre alanları */
  children: ReactNode;
  /** Alt aksiyonlar (Temizle / Uygula). Verilmezse footer gizlenir. */
  footer?: ReactNode;
  /** Aktif filtre sayısı; başlık yanında rozet olarak gösterilir. */
  activeCount?: number;
  className?: string;
}

/**
 * Sağdan slide-in filtre paneli. Headless UI Dialog kullanır; ESC ile kapanır,
 * arka plan tıklanınca kapanır, focus trap'i otomatik yönetir.
 */
export function FilterDrawer({
  open,
  onClose,
  title = 'Filtreler',
  children,
  footer,
  activeCount,
  className,
}: FilterDrawerProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-250"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel
              className={cn(
                'flex h-full w-screen max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900',
                className,
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                  <Icon name="filter_list" size="sm" className="text-slate-500 dark:text-slate-400" />
                  {title}
                  {activeCount !== undefined && activeCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                      {activeCount}
                    </span>
                  )}
                </DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Kapat"
                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  {footer}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

/**
 * Drawer içinde alanları gruplamak için ufak yardımcı.
 * <FilterGroup title="Lokasyon"><FilterField label="Çıkış"><Select.../></FilterField></FilterGroup>
 */
export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
