import { SearchInput, Select, Button, DatePicker } from '@/components/ui';
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
  const serviceTypeOptions = getOptions('service_type');
  const countryOptions = getOptions('country');
  const incotermOptions = getOptions('incoterm');
  const sourceOptions = getOptions('customer_source');

  function handleChange(key: keyof CustomerFiltersType, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6">
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

        {/* Service Type */}
        <div className="w-44">
          <Select
            options={serviceTypeOptions}
            placeholder="Servis Tipi"
            value={filters.serviceType || ''}
            onChange={(e) => handleChange('serviceType', e.target.value)}
          />
        </div>

        {/* Origin Country */}
        <div className="w-44">
          <Select
            options={countryOptions}
            placeholder="Cikis Ulkesi"
            value={filters.originCountry || ''}
            onChange={(e) => handleChange('originCountry', e.target.value)}
          />
        </div>

        {/* Destination Country */}
        <div className="w-44">
          <Select
            options={countryOptions}
            placeholder="Varis Ulkesi"
            value={filters.destinationCountry || ''}
            onChange={(e) => handleChange('destinationCountry', e.target.value)}
          />
        </div>

        {/* Incoterm */}
        <div className="w-40">
          <Select
            options={incotermOptions}
            placeholder="Incoterm"
            value={filters.incoterm || ''}
            onChange={(e) => handleChange('incoterm', e.target.value)}
          />
        </div>

        {/* Source */}
        <div className="w-44">
          <Select
            options={sourceOptions}
            placeholder="Kaynak"
            value={filters.source || ''}
            onChange={(e) => handleChange('source', e.target.value)}
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

        {/* Date Range */}
        <div className="w-40">
          <DatePicker
            placeholder="Baslangic"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>
        <div className="w-40">
          <DatePicker
            placeholder="Bitis"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onClear}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
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
