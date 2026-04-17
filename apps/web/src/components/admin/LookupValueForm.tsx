import { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import type { LookupValue, LookupCreateInput } from '@nakliye-crm/shared';
import type { LookupUpdateInput } from '@/services/lookup.service';

interface LookupValueFormProps {
  isOpen: boolean;
  onClose: () => void;
  item?: LookupValue | null;
  category: string;
  categoryLabel: string;
  nextSortOrder: number;
  onSubmit: (data: LookupCreateInput | LookupUpdateInput) => Promise<void>;
}

export function LookupValueForm({
  isOpen,
  onClose,
  item,
  category,
  categoryLabel,
  nextSortOrder,
  onSubmit,
}: LookupValueFormProps) {
  const isEditing = !!item;

  const [value, setValue] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setValue(item.value);
        setSortOrder(item.sortOrder);
      } else {
        setValue('');
        setSortOrder(nextSortOrder);
      }
      setError('');
    }
  }, [isOpen, item, nextSortOrder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Deger zorunludur');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await onSubmit({ value: value.trim(), sortOrder });
      } else {
        await onSubmit({ category, value: value.trim(), sortOrder });
      }
      onClose();
    } catch (err) {
      console.error('Lookup form error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Degeri Düzenle` : `${categoryLabel} - Yeni Deger`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button loading={saving} onClick={handleSubmit} icon={isEditing ? 'save' : 'add'}>
            {isEditing ? 'Kaydet' : 'Ekle'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deger"
          icon="label"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          error={error}
          placeholder="Örnek: Denizyolu"
          autoFocus
        />

        <Input
          label="Siralama"
          icon="sort"
          type="number"
          value={sortOrder.toString()}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
          min={1}
        />
      </form>
    </Modal>
  );
}
