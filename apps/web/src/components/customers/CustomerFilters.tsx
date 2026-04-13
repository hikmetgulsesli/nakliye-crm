import { SearchInput, Select, Button } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import type { CustomerFilters as CustomerFiltersType } from '@/services/customer.service';

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onChange: (filters: CustomerFiltersType) => void;
  onApply: () => void;
  onClear: () => void;
  users: { value: string; label: string }[];
}

export function CustomerFilters({
  filters,
  onChange,
  onApply,
  onClear,
  users,
}: CustomerFiltersProps) {
  const { getOptions } = useLookups();

  const statusOptions = getOptions('customer_status');
  const potentialOptions = getOptions('potential_level');
  const transportModeOptions = getOptions('transport_mode');

  function handleChange(key: keyof CustomerFiltersType, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="w-64">
          <SearchInput
            placeholder="Firma adi, telefon, e-posta..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="w-44">
          <Select
            options={statusOptions}
            placeholder="Durum"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          />
        </div>

        {/* Potential */}
        <div className="w-44">
          <Select
            options={potentialOptions}
            placeholder="Potansiyel"
            value={filters.potential || ''}
            onChange={(e) => handleChange('potential', e.target.value)}
          />
        </div>

        {/* Transport Mode */}
        <div className="w-44">
          <Select
            options={transportModeOptions}
            placeholder="Tasima Modu"
            value={filters.transportMode || ''}
            onChange={(e) => handleChange('transportMode', e.target.value)}
          />
        </div>

        {/* Assigned User */}
        <div className="w-48">
          <Select
            options={users}
            placeholder="Atanan Temsilci"
            value={filters.assignedUserId?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                assignedUserId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
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
