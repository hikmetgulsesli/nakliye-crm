import { type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface DropdownItem {
  key: string;
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
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

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      <div
        className={cn(
          'absolute z-40 mt-2 min-w-[180px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg py-1 transition-all duration-150 origin-top',
          align === 'right' ? 'right-0' : 'left-0',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
        )}
      >
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              item.onClick();
              setIsOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors',
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            {item.icon && (
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
