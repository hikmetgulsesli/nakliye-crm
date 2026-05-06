import { useEffect, useState } from 'react';
import { Modal, Button, Textarea, Icon } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import { cn } from '@/utils/cn';

interface LossReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mevcut lossReason CSV; edit/yeniden secimde state'i bootstrap eder */
  initialValue?: string | null;
  /** Kullanici 'Kaydet' deyince CSV (ya da ham metin) ile cagrilir.
   *  Promise reddolursa modal acik kalir; cozulurse otomatik kapanir. */
  onConfirm: (lossReasonCsv: string) => Promise<void>;
}

/**
 * Teklif statusu "Kaybedildi"ye gectiginde acilan modal.
 * Inline durum degistirme (liste/detay) icin kullaniciya kaybetme nedenini
 * sorar; secim yapilmadan kayit ilerlemez.
 */
export function LossReasonModal({
  isOpen,
  onClose,
  initialValue,
  onConfirm,
}: LossReasonModalProps) {
  const { getOptions } = useLookups();
  const lossReasonOptions = getOptions('loss_reason');

  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal acildikca initialValue'dan bootstrap et.
  // ONEMLI: lossReasonOptions DEPENDENCY OLARAK EKLEMIYORUZ — useLookups
  // her render'da yeni array referansi doner; eklersek effect her render'da
  // calisip kullanicinin secimini sifirlar. Sadece modal isOpen olunca veya
  // initialValue degisince bootstrap et.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSubmitting(false);
    const raw = (initialValue || '').trim();
    if (!raw) {
      setSelected([]);
      setOtherText('');
      return;
    }
    const known = lossReasonOptions.map((o) => o.value);
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const picks: string[] = [];
    const unknownBits: string[] = [];
    for (const p of parts) {
      if (known.includes(p)) picks.push(p);
      else unknownBits.push(p);
    }
    if (unknownBits.length > 0) {
      if (!picks.includes('Diğer')) picks.push('Diğer');
      setOtherText(unknownBits.join(', '));
    } else {
      setOtherText('');
    }
    setSelected(picks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialValue]);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function buildCsv(): string {
    if (selected.length === 0) return '';
    return selected
      .map((v) => (v === 'Diğer' && otherText.trim() ? otherText.trim() : v))
      .filter(Boolean)
      .join(', ');
  }

  async function handleConfirm() {
    if (selected.length === 0) {
      setError('En az bir neden seçmelisiniz.');
      return;
    }
    if (selected.includes('Diğer') && !otherText.trim()) {
      setError('"Diğer" seçtiyseniz açıklama da girin.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(buildCsv());
      // onConfirm icinde caller modal'i kapatmak istiyor olabilir; defansif kapat
      onClose();
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message || 'Kayıt başarısız oldu.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="mb-5 text-center">
        <div className="flex items-center justify-center size-14 rounded-full bg-rose-100 mx-auto mb-3 dark:bg-rose-500/15">
          <Icon name="sentiment_dissatisfied" className="text-rose-600 dark:text-rose-400" size="lg" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Kaybetme Nedeni
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Teklifin neden kaybedildiğini bir veya birden fazla seçenekle belirt.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 p-2 max-h-[280px] overflow-y-auto">
        {lossReasonOptions.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-sm transition-colors',
                checked
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(o.value)}
                className="size-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-600"
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>

      {selected.includes('Diğer') && (
        <div className="mt-3">
          <Textarea
            label="Detay (Diğer)"
            placeholder="Lütfen kaybetme detayını açıklayın..."
            rows={2}
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
          />
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Vazgeç
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={submitting}>
          Kaybedildi olarak Kaydet
        </Button>
      </div>
    </Modal>
  );
}
