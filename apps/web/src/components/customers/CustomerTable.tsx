import { useNavigate } from 'react-router-dom';
import { Table, Icon } from '@/components/ui';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InlineEditSelect } from '@/components/shared/InlineEditSelect';
import type { Customer } from '@nakliye-crm/shared';
import { formatTrPhones } from '@nakliye-crm/shared';

const CUSTOMER_STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif', pillClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { value: 'Pasif', label: 'Pasif', pillClass: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  { value: 'Soğuk', label: 'Soğuk', pillClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
];

const CUSTOMER_POTENTIAL_OPTIONS = [
  { value: 'Yüksek', label: 'Yüksek', pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  { value: 'Orta', label: 'Orta', pillClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
  { value: 'Düşük', label: 'Düşük', pillClass: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
];

interface CustomerTableProps {
  data: Customer[];
  loading?: boolean;
  mode?: 'active' | 'deleted';
  onRestore?: (id: number) => void;
  restoringId?: number | null;
  /** Tıkla-değiştir hücreleri için callback */
  onInlineUpdate?: (id: number, patch: { status?: string; potential?: string }) => Promise<void>;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function CustomerTable({
  data,
  loading,
  mode = 'active',
  onRestore,
  restoringId,
  onInlineUpdate,
}: CustomerTableProps) {
  const navigate = useNavigate();
  const isDeleted = mode === 'deleted';

  const columns = [
    {
      key: 'companyName',
      label: 'FIRMA ADI',
      render: (row: Customer) =>
        isDeleted ? (
          <span className="text-slate-700 dark:text-slate-300 font-medium line-through decoration-slate-300 dark:decoration-slate-600">
            {row.companyName}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/musteriler/${row.id}`);
            }}
            className="text-primary font-bold hover:underline text-left"
          >
            {row.companyName}
          </button>
        ),
    },
    {
      key: 'contactName',
      label: 'YETKILI',
      render: (row: Customer) => (
        <span className="text-slate-700 dark:text-slate-300">{row.contactName || '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'TELEFON',
      render: (row: Customer) => (
        <span className="text-slate-700 dark:text-slate-300">{formatTrPhones(row.phone) || row.phone}</span>
      ),
    },
    {
      key: 'status',
      label: 'DURUM',
      render: (row: Customer) =>
        onInlineUpdate && !isDeleted ? (
          <InlineEditSelect
            value={row.status}
            options={CUSTOMER_STATUS_OPTIONS}
            onSave={(next) => onInlineUpdate(row.id, { status: next })}
          />
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      key: 'potential',
      label: 'POTANSIYEL',
      render: (row: Customer) =>
        onInlineUpdate && !isDeleted ? (
          <InlineEditSelect
            value={row.potential ?? ''}
            options={CUSTOMER_POTENTIAL_OPTIONS}
            onSave={(next) => onInlineUpdate(row.id, { potential: next })}
            renderLabel={(opt, raw) => (raw ? opt?.label ?? raw : <span className="text-slate-400">Seç</span>)}
          />
        ) : row.potential ? (
          <StatusBadge status={row.potential} />
        ) : (
          <span className="text-slate-400 dark:text-slate-500">-</span>
        ),
    },
    {
      key: 'assignedUser',
      label: 'TEMSILCI',
      render: (row: Customer) => (
        <span className="text-slate-700 dark:text-slate-300">
          {row.assignedUser?.fullName || '-'}
        </span>
      ),
    },
    {
      key: 'lastContactDate',
      label: 'SON GORUSME',
      render: (row: Customer) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.lastContactDate)}
        </span>
      ),
    },
    {
      key: 'lastQuoteDate',
      label: 'SON TEKLIF',
      render: (row: Customer) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {formatDate(row.lastQuoteDate)}
        </span>
      ),
    },
  ];

  if (isDeleted && onRestore) {
    columns.push({
      key: 'actions',
      label: 'AKSIYON',
      render: (row: Customer) => {
        const isRestoring = restoringId === row.id;
        return (
          <button
            type="button"
            disabled={isRestoring}
            onClick={(e) => {
              e.stopPropagation();
              onRestore(row.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
          >
            <Icon name="restore" size="sm" />
            {isRestoring ? 'Geri Yukleniyor...' : 'Geri Yükle'}
          </button>
        );
      },
    });
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-slate-50 dark:bg-slate-800/60 h-12" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 rounded w-1/6" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
              <div className="h-4 bg-slate-200 rounded w-1/12" />
              <div className="h-4 bg-slate-200 rounded w-1/12" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <Table<Customer & Record<string, unknown>>
        columns={columns}
        data={data as (Customer & Record<string, unknown>)[]}
        onRowClick={isDeleted ? undefined : (row) => navigate(`/musteriler/${row.id}`)}
        emptyMessage={isDeleted ? 'Silinmiş müşteri bulunamadı' : 'Müşteri bulunamadı'}
      />
    </div>
  );
}
