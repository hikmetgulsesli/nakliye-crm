import { SearchInput, Select, Button, DatePicker } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import type { QuotationFilters as QuotationFiltersType } from '@/services/quotation.service';

interface QuotationFiltersProps {
  filters: QuotationFiltersType;
  onChange: (filters: QuotationFiltersType) => void;
  onApply: () => void;
  onClear: () => void;
  users: { value: string; label: string }[];
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'TRY', label: 'TRY' },
];

export function QuotationFilters({
  filters,
  onChange,
  onApply,
  onClear,
  users,
}: QuotationFiltersProps) {
  const { getOptions } = useLookups();

  const statusOptions = [
    { value: 'Bekliyor', label: 'Bekliyor' },
    { value: 'Kazanildi', label: 'Kazanildi' },
    { value: 'Kaybedildi', label: 'Kaybedildi' },
  ];
  const transportModeOptions = getOptions('transport_mode');

  function handleChange(key: keyof QuotationFiltersType, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="w-64">
          <SearchInput
            placeholder="Teklif no veya musteri ara..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Date From */}
        <div className="w-40">
          <DatePicker
            placeholder="Baslangic"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="w-40">
          <DatePicker
            placeholder="Bitis"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="w-40">
          <Select
            options={statusOptions}
            placeholder="Tumu"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          />
        </div>

        {/* Transport Mode */}
        <div className="w-40">
          <Select
            options={transportModeOptions}
            placeholder="Tasima Modu"
            value={filters.transportMode || ''}
            onChange={(e) => handleChange('transportMode', e.target.value)}
          />
        </div>

        {/* Assigned User */}
        <div className="w-44">
          <Select
            options={users}
            placeholder="Temsilci"
            value={filters.assignedUserId?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                assignedUserId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        {/* Currency */}
        <div className="w-32">
          <Select
            options={CURRENCY_OPTIONS}
            placeholder="Para Birimi"
            value={filters.currency || ''}
            onChange={(e) => handleChange('currency', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onClear}
            className="text-sm text-slate-500 hover:text-primary transition-colors font-medium"
          >
            Temizle
          </button>
          <Button size="md" icon="filter_list" onClick={onApply}>
            Filtrele
          </Button>
        </div>
      </div>
    </div>
  );
}
