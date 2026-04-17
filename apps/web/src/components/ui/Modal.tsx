import { type ReactNode, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col',
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700 dark:text-slate-300">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
