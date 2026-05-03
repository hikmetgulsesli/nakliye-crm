import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { activityService } from '@/services/activity.service';
import { cn } from '@/utils/cn';

/**
 * "Hizli Log" pop-over'i — musteri detayinda 5 saniyede aksiyon kayit etmek icin.
 * Telefon secilince outcome chip'leri ile cevapsiz/sesli mesaj ayrilir;
 * cevapsiz cagrilar musteri-erisimi sayilmaz (KPI temizligi).
 */

interface QuickLogPopoverProps {
  customerId: number;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Sayfada butonun konumuna gore acilis tarafi */
  align?: 'left' | 'right';
}

type ActionKey = 'phone' | 'whatsapp' | 'email' | 'meeting' | 'note';
type CallOutcome = 'answered' | 'no_answer' | 'voicemail';

interface ActionDef {
  key: ActionKey;
  icon: string;
  label: string;
  defaultActivityType: string;
  defaultNote: string;
  hasCallOutcome?: boolean;
}

const ACTIONS: ActionDef[] = [
  { key: 'phone', icon: 'phone', label: 'Aradım', defaultActivityType: 'Telefon', defaultNote: 'Aradım', hasCallOutcome: true },
  { key: 'whatsapp', icon: 'chat', label: 'WhatsApp', defaultActivityType: 'WhatsApp', defaultNote: 'WhatsApp gönderdim' },
  { key: 'email', icon: 'mail', label: 'Mail attım', defaultActivityType: 'E-posta', defaultNote: 'Mail gönderdim' },
  { key: 'meeting', icon: 'groups', label: 'Toplantı', defaultActivityType: 'Yüz Yüze', defaultNote: 'Toplantı yapıldı' },
  { key: 'note', icon: 'edit_note', label: 'Not düştüm', defaultActivityType: 'Not', defaultNote: '' },
];

const CALL_OUTCOMES: { key: CallOutcome; label: string; activityType: string; defaultNote: string }[] = [
  { key: 'answered', label: 'Cevap aldım', activityType: 'Telefon', defaultNote: 'Aradım, görüştük' },
  { key: 'no_answer', label: 'Açmadı', activityType: 'Telefon (cevapsız)', defaultNote: 'Aradım, açmadı' },
  { key: 'voicemail', label: 'Sesli mesaj', activityType: 'Telefon (cevapsız)', defaultNote: 'Aradım, sesli mesaj bıraktım' },
];

export function QuickLogPopover({ customerId, open, onClose, onSaved, align = 'right' }: QuickLogPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ActionDef | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popover acildiginda secimi sifirla
  useEffect(() => {
    if (open) {
      setSelected(null);
      setCallOutcome(null);
      setNote('');
      setError(null);
    }
  }, [open]);

  // Disari tiklamada kapat
  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener('mousedown', onMouse);
    return () => document.removeEventListener('mousedown', onMouse);
  }, [open, onClose]);

  // Esc kapatir
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function pickAction(a: ActionDef) {
    setSelected(a);
    setCallOutcome(null);
    setNote(a.defaultNote);
    setError(null);
  }

  function pickCallOutcome(o: typeof CALL_OUTCOMES[number]) {
    setCallOutcome(o.key);
    setNote(o.defaultNote);
  }

  function resolveActivityType(): string | null {
    if (!selected) return null;
    if (selected.hasCallOutcome) {
      const o = CALL_OUTCOMES.find((x) => x.key === callOutcome);
      return o ? o.activityType : null;
    }
    return selected.defaultActivityType;
  }

  const activityType = resolveActivityType();
  const canSave =
    !!selected && (selected.key !== 'phone' || !!callOutcome) && !saving;

  async function save() {
    if (!activityType || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await activityService.create({
        customerId,
        activityType,
        activityDate: new Date().toISOString(),
        notes: note?.trim() || undefined,
      });
      // Dashboard widget'lari ve KPI'lari yenilenmesi icin global sinyal
      window.dispatchEvent(
        new CustomEvent('activity:logged', { detail: { customerId, activityType } }),
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Kaydedilemedi';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full mt-2 z-30 w-[340px] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900',
        align === 'right' ? 'right-0' : 'left-0',
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hızlı Log</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Az önce yaptığın aksiyonu tek tıkla kaydet
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 p-3">
        {ACTIONS.map((a) => {
          const active = selected?.key === a.key;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => pickAction(a)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary dark:border-primary-400 dark:bg-primary/20 dark:text-primary-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <span className="material-symbols-outlined text-[22px] leading-none">{a.icon}</span>
              <span className="text-[11px] font-medium leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>

      {selected?.hasCallOutcome && (
        <div className="border-t border-slate-100 px-4 pt-3 pb-2 dark:border-slate-800">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Sonuç
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CALL_OUTCOMES.map((o) => {
              const active = callOutcome === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => pickCallOutcome(o)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="px-4 pt-3 pb-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Kısa not (ops.)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Kısaca ne oldu?"
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            canSave
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600',
          )}
        >
          <Icon name={saving ? 'progress_activity' : 'check'} size="sm" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
