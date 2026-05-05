import { useMemo, useState } from 'react';
import { SearchInput, Select, Button, Icon } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import {
  FilterDrawer,
  FilterGroup,
  FilterField,
} from '@/components/shared/FilterDrawer';
import { ActiveFiltersChips, type ActiveFilter } from '@/components/shared/ActiveFiltersChips';
import { DateRangeQuickFilter } from '@/components/shared/DateRangeQuickFilter';
import { cn } from '@/utils/cn';
import type { CustomerFilters as CustomerFiltersType } from '@/services/customer.service';

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onChange: (filters: CustomerFiltersType) => void;
  onApply: () => void;
  onClear: () => void;
  users: { value: string; label: string }[];
  showOnlyMine?: boolean;
  onlyMine?: boolean;
  onOnlyMineChange?: (next: boolean) => void;
  hideAssignedUserSelect?: boolean;
}

/**
 * Filtreleme şu prensiplerle çalışır:
 *  - Üst satır her zaman görünür: arama + (USER) "kendi kayıtlarım" + Filtreler butonu
 *  - Tüm detaylı alanlar sağdan açılan Drawer'da gruplandırılmış
 *  - Aktif filtreler rozet olarak üst altında görünür, tek tıkla kaldırılabilir
 *  - "Uygula" Drawer'ı kapatır; "Tümünü temizle" rozet satırından çalışır
 */
export function CustomerFilters({
  filters,
  onChange,
  onApply,
  onClear,
  users,
  showOnlyMine = false,
  onlyMine = false,
  onOnlyMineChange,
  hideAssignedUserSelect = false,
}: CustomerFiltersProps) {
  const { getOptions } = useLookups();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const statusOptions = getOptions('customer_status');
  const potentialOptions = getOptions('potential_level');
  const transportModeOptions = getOptions('transport_mode');
  const serviceTypeOptions = getOptions('service_type');
  const countryOptions = getOptions('country');
  const incotermOptions = getOptions('incoterm');
  const sourceOptions = getOptions('customer_source');

  function set<K extends keyof CustomerFiltersType>(
    key: K,
    value: CustomerFiltersType[K] | undefined,
  ) {
    onChange({ ...filters, [key]: value === '' ? undefined : value });
  }

  function labelOf(options: { value: string; label: string }[], value?: string) {
    return options.find((o) => o.value === value)?.label ?? value ?? '';
  }

  // Aktif (search hariç, çünkü search üst satırda canlı görünüyor) filtreleri rozetle.
  const activeChips = useMemo<ActiveFilter[]>(() => {
    const out: ActiveFilter[] = [];
    if (filters.status)
      out.push({
        key: 'status',
        label: 'Durum',
        value: labelOf(statusOptions, filters.status),
        onRemove: () => set('status', undefined),
      });
    if (filters.potential)
      out.push({
        key: 'potential',
        label: 'Potansiyel',
        value: labelOf(potentialOptions, filters.potential),
        onRemove: () => set('potential', undefined),
      });
    if (filters.transportMode)
      out.push({
        key: 'transportMode',
        label: 'Taşıma',
        value: labelOf(transportModeOptions, filters.transportMode),
        onRemove: () => set('transportMode', undefined),
      });
    if (filters.serviceType)
      out.push({
        key: 'serviceType',
        label: 'Servis',
        value: labelOf(serviceTypeOptions, filters.serviceType),
        onRemove: () => set('serviceType', undefined),
      });
    // Musteri kaydinda "ilgilendigi ulkeler" tek listede tutuluyor; backend
    // hala originCountry/destinationCountry filtrelerini destekliyor (aynisi
    // her ikisinde de yazili oldugu icin orig/dest fark etmez).
    if (filters.originCountry)
      out.push({
        key: 'originCountry',
        label: 'Ülke',
        value: labelOf(countryOptions, filters.originCountry),
        onRemove: () => set('originCountry', undefined),
      });
    if (filters.incoterm)
      out.push({
        key: 'incoterm',
        label: 'Incoterm',
        value: filters.incoterm,
        onRemove: () => set('incoterm', undefined),
      });
    if (filters.source)
      out.push({
        key: 'source',
        label: 'Kaynak',
        value: labelOf(sourceOptions, filters.source),
        onRemove: () => set('source', undefined),
      });
    if (filters.assignedUserId && !hideAssignedUserSelect) {
      const u = users.find((u) => u.value === String(filters.assignedUserId));
      out.push({
        key: 'assignedUserId',
        label: 'Temsilci',
        value: u?.label ?? `#${filters.assignedUserId}`,
        onRemove: () => set('assignedUserId', undefined),
      });
    }
    // Tarih chip'leri burada gosterilmiyor — ust bar'daki DateRangeQuickFilter
    // zaten secili araligi gosteriyor; chip olarak tekrar etmeye gerek yok.
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, users, hideAssignedUserSelect]);

  const activeCount = activeChips.length;

  function handleApply() {
    setDrawerOpen(false);
    onApply();
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Üst kompakt satır: arama + tarih hizli filtre + onlyMine + Filtreler butonu */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[260px] flex-1">
            <SearchInput
              placeholder="Firma adı, telefon, e-posta..."
              value={filters.search || ''}
              onChange={(e) => set('search', e.target.value)}
            />
          </div>

          {showOnlyMine && (
            <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => onOnlyMineChange?.(e.target.checked)}
                className="size-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-600"
              />
              <span className="whitespace-nowrap">Sadece kendi müşterilerim</span>
            </label>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
              activeCount > 0
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name="tune" size="sm" />
            Filtreler
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <DateRangeQuickFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) => onChange({ ...filters, startDate, endDate })}
        />
      </div>

      {/* Aktif filtre rozetleri */}
      {activeCount > 0 && (
        <ActiveFiltersChips filters={activeChips} onClearAll={onClear} />
      )}

      {/* Drawer: tüm detaylı filtreler */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Müşteri Filtreleri"
        activeCount={activeCount}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClear();
              }}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
            >
              Temizle
            </button>
            <Button size="md" icon="check" onClick={handleApply}>
              Uygula
            </Button>
          </div>
        }
      >
        <FilterGroup title="Genel">
          <FilterField label="Durum">
            <Select
              options={statusOptions}
              placeholder="Tümü"
              value={filters.status || ''}
              onChange={(e) => set('status', e.target.value)}
            />
          </FilterField>
          <FilterField label="Potansiyel">
            <Select
              options={potentialOptions}
              placeholder="Tümü"
              value={filters.potential || ''}
              onChange={(e) => set('potential', e.target.value)}
            />
          </FilterField>
          <FilterField label="Müşteri Kaynağı">
            <Select
              options={sourceOptions}
              placeholder="Tümü"
              value={filters.source || ''}
              onChange={(e) => set('source', e.target.value)}
            />
          </FilterField>
          {!hideAssignedUserSelect && (
            <FilterField label="Atanan Temsilci">
              <Select
                options={users}
                placeholder="Tümü"
                value={filters.assignedUserId?.toString() || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    assignedUserId: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </FilterField>
          )}
        </FilterGroup>

        <FilterGroup title="Lojistik">
          <FilterField label="Taşıma Modu">
            <Select
              options={transportModeOptions}
              placeholder="Tümü"
              value={filters.transportMode || ''}
              onChange={(e) => set('transportMode', e.target.value)}
            />
          </FilterField>
          <FilterField label="Servis Tipi">
            <Select
              options={serviceTypeOptions}
              placeholder="Tümü"
              value={filters.serviceType || ''}
              onChange={(e) => set('serviceType', e.target.value)}
            />
          </FilterField>
          <FilterField label="Incoterm">
            <Select
              options={incotermOptions}
              placeholder="Tümü"
              value={filters.incoterm || ''}
              onChange={(e) => set('incoterm', e.target.value)}
            />
          </FilterField>
        </FilterGroup>

        <FilterGroup title="İlgilendiği Ülke">
          <FilterField label="Ülke">
            <Select
              options={countryOptions}
              placeholder="Tümü"
              value={filters.originCountry || ''}
              onChange={(e) => set('originCountry', e.target.value)}
            />
          </FilterField>
        </FilterGroup>
      </FilterDrawer>
    </div>
  );
}

