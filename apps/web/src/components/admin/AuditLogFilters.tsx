import { Button, Select, DatePicker } from '@/components/ui';
import type { AuditLogFilters as AuditLogFiltersType } from '@/services/audit.service';

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onChange: (filters: AuditLogFiltersType) => void;
  onApply: () => void;
  onExportCsv: () => void;
  users: { value: string; label: string }[];
}

const ACTION_OPTIONS = [
  { value: '', label: 'Tüm İşlemler' },
  { value: 'CREATE', label: 'Oluşturma' },
  { value: 'UPDATE', label: 'Güncelleme' },
  { value: 'DELETE', label: 'Silme' },
  { value: 'BULK_TRANSFER', label: 'Toplu Devir' },
];

const RECORD_TYPE_OPTIONS = [
  { value: '', label: 'Tüm Turler' },
  { value: 'Customer', label: 'Müşteri' },
  { value: 'Quotation', label: 'Teklif' },
  { value: 'User', label: 'Kullanıcı' },
  { value: 'LookupValue', label: 'Liste Değeri' },
  { value: 'Activity', label: 'Aktivite' },
];

export function AuditLogFilters({
  filters,
  onChange,
  onApply,
  onExportCsv,
  users,
}: AuditLogFiltersProps) {
  const userOptions = [
    { value: '', label: 'Tüm Kullanıcılar' },
    ...users,
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* KULLANICI */}
        <Select
          label="Kullanıcı"
          icon="person"
          value={filters.userId?.toString() ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              userId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          options={userOptions}
        />

        {/* ISLEM TIPI */}
        <Select
          label="İşlem Tipi"
          icon="bolt"
          value={filters.action ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              action: e.target.value || undefined,
            })
          }
          options={ACTION_OPTIONS}
        />

        {/* KAYIT TURU */}
        <Select
          label="Kayıt Turu"
          icon="category"
          value={filters.recordType ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              recordType: e.target.value || undefined,
            })
          }
          options={RECORD_TYPE_OPTIONS}
        />

        {/* TARIH ARALIGI */}
        <div className="flex gap-2">
          <DatePicker
            label="Başlangıç"
            value={filters.startDate ?? ''}
            onChange={(e) =>
              onChange({ ...filters, startDate: e.target.value || undefined })
            }
          />
          <DatePicker
            label="Bitiş"
            value={filters.endDate ?? ''}
            onChange={(e) =>
              onChange({ ...filters, endDate: e.target.value || undefined })
            }
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon="download"
            size="md"
            onClick={onExportCsv}
            className="whitespace-nowrap"
          >
            CSV
          </Button>
          <Button icon="filter_list" size="md" onClick={onApply}>
            Filtrele
          </Button>
        </div>
      </div>
    </div>
  );
}
