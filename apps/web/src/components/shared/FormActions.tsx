import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';

interface FormActionsProps {
  formId: string;
  onCancel: () => void;
  loading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

/**
 * Sayfa header'ında kullanılan kompakt Kaydet/İptal aksiyonları.
 * Form'a uzaktan bağlanır (`type="submit" form={formId}`); formun kendi alt
 * action bar'ı hâlâ koruna bilir, ikisi de aynı submit'i tetikler.
 */
export function FormActions({
  formId,
  onCancel,
  loading = false,
  saveLabel = 'Kaydet',
  cancelLabel = 'İptal',
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        title={cancelLabel}
        aria-label={cancelLabel}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
          'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
          'disabled:opacity-60',
        )}
      >
        <Icon name="close" size="sm" />
        <span className="hidden sm:inline">{cancelLabel}</span>
      </button>
      <button
        type="submit"
        form={formId}
        disabled={loading}
        title={saveLabel}
        aria-label={saveLabel}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors',
          'bg-primary hover:bg-primary/90',
          'disabled:opacity-60',
        )}
      >
        <Icon name={loading ? 'progress_activity' : 'save'} size="sm" className={loading ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">{loading ? 'Kaydediliyor...' : saveLabel}</span>
      </button>
    </div>
  );
}
