import { useState } from 'react';
import { Button, Icon, Avatar } from '@/components/ui';
import type { User } from '@nakliye-crm/shared';
import {
  transferService,
  type TransferPreview,
  type TransferPreviewRequest,
} from '@/services/transfer.service';

interface TransferFormProps {
  users: (User & { customerCount?: number; quoteCount?: number })[];
  onTransferComplete: () => void;
}

type TransferScope = 'all' | 'active_customers' | 'open_quotes';

export function TransferForm({ users, onTransferComplete }: TransferFormProps) {
  const [fromUserId, setFromUserId] = useState<number | null>(null);
  const [toUserId, setToUserId] = useState<number | null>(null);
  const [scope, setScope] = useState<TransferScope>('all');
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);

  const fromUser = users.find((u) => u.id === fromUserId);
  const toUser = users.find((u) => u.id === toUserId);

  async function handlePreview() {
    if (!fromUserId || !toUserId) return;
    setLoadingPreview(true);
    try {
      const result = await transferService.preview({
        fromUserId,
        toUserId,
        scope,
      });
      setPreview(result);
    } catch (err) {
      console.error('Transfer preview error:', err);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleExecute() {
    if (!fromUserId || !toUserId) return;
    setExecuting(true);
    try {
      await transferService.execute({
        fromUserId,
        toUserId,
        scope,
      } as TransferPreviewRequest);
      setPreview(null);
      setFromUserId(null);
      setToUserId(null);
      setScope('all');
      onTransferComplete();
    } catch (err) {
      console.error('Transfer execute error:', err);
    } finally {
      setExecuting(false);
    }
  }

  function handleCancel() {
    setPreview(null);
  }

  const scopeOptions: { value: TransferScope; label: string }[] = [
    { value: 'all', label: 'Tum kayitlar' },
    { value: 'active_customers', label: 'Sadece aktif musteriler' },
    { value: 'open_quotes', label: 'Acik teklifler' },
  ];

  const availableToUsers = users.filter((u) => u.id !== fromUserId && u.isActive);

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-xl bg-blue-50 text-primary mb-3">
            <Icon name="swap_horiz" size="lg" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Temsilci Devir Islemi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Musteri ve teklif sahipligini temsilciler arasinda aktarin
          </p>
        </div>

        {/* From User */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Devredilecek Temsilci
          </label>
          <div className="relative">
            <select
              value={fromUserId ?? ''}
              onChange={(e) => {
                setFromUserId(e.target.value ? Number(e.target.value) : null);
                setPreview(null);
              }}
              className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 pl-4 pr-10 appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">Temsilci secin...</option>
              {users
                .filter((u) => u.isActive)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.customerCount ?? 0} musteri)
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Icon name="expand_more" size="sm" />
            </div>
          </div>
          {fromUser && (
            <div className="flex items-center gap-3 mt-2 px-1">
              <Avatar name={fromUser.fullName} src={fromUser.avatarUrl} size="sm" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {fromUser.fullName} - {fromUser.customerCount ?? 0} musteri
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-2">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Icon name="arrow_downward" size="sm" />
          </div>
        </div>

        {/* To User */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Devralacak Temsilci
          </label>
          <div className="relative">
            <select
              value={toUserId ?? ''}
              onChange={(e) => {
                setToUserId(e.target.value ? Number(e.target.value) : null);
                setPreview(null);
              }}
              className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 pl-4 pr-10 appearance-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">Temsilci secin...</option>
              {availableToUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.customerCount ?? 0} musteri)
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Icon name="expand_more" size="sm" />
            </div>
          </div>
          {toUser && (
            <div className="flex items-center gap-3 mt-2 px-1">
              <Avatar name={toUser.fullName} src={toUser.avatarUrl} size="sm" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {toUser.fullName} - {toUser.customerCount ?? 0} musteri
              </span>
            </div>
          )}
        </div>

        {/* Scope radio buttons */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Hangi Kayitlar Devredilsin?
          </label>
          <div className="space-y-3">
            {scopeOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="transferScope"
                    value={opt.value}
                    checked={scope === opt.value}
                    onChange={() => {
                      setScope(opt.value);
                      setPreview(null);
                    }}
                    className="peer sr-only"
                  />
                  <div className="size-5 rounded-full border-2 border-slate-300 peer-checked:border-primary transition-colors" />
                  <div className="absolute size-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:text-slate-100 transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview button */}
        <div className="flex justify-center">
          <Button
            variant="secondary"
            icon="preview"
            loading={loadingPreview}
            disabled={!fromUserId || !toUserId}
            onClick={handlePreview}
          >
            Onizleme
          </Button>
        </div>
      </div>

      {/* Preview section */}
      {preview && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 max-w-2xl mx-auto">
          {/* Summary badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-primary rounded-full px-4 py-2 text-sm font-bold">
              <Icon name="info" size="sm" />
              Devir Ozeti
            </span>
          </div>

          {/* From -> To */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Avatar name={preview.sourceUser.fullName} size="md" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {preview.sourceUser.fullName}
              </span>
            </div>
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="arrow_forward" size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={preview.targetUser.fullName} size="md" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {preview.targetUser.fullName}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {preview.affectedRecords.customers}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">musteri</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {preview.affectedRecords.quotations}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">acik teklif</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {preview.affectedRecords.activities}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">aktivite kaydi</p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <Icon name="warning" size="sm" className="text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Bu islem geri alinmaz. Devam etmek istediginizden emin misiniz?
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCancel}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 font-medium px-4 py-2 transition-colors"
            >
              Iptal
            </button>
            <Button
              icon="swap_horiz"
              loading={executing}
              onClick={handleExecute}
            >
              Devri Onayla
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
