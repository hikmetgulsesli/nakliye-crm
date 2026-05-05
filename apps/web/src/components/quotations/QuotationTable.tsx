import { useNavigate } from 'react-router-dom';
import { Table, Badge } from '@/components/ui';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RouteVisual } from '@/components/shared/RouteVisual';
import { InlineEditSelect } from '@/components/shared/InlineEditSelect';
import type { Quotation } from '@nakliye-crm/shared';

const QUOTE_STATUS_OPTIONS = [
  { value: 'Bekliyor', label: 'Bekliyor', pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  { value: 'Kazanıldı', label: 'Kazanıldı', pillClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { value: 'Kaybedildi', label: 'Kaybedildi', pillClass: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
  { value: 'İptal', label: 'İptal', pillClass: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
];

interface QuotationTableProps {
  data: Quotation[];
  loading?: boolean;
  /** Tıkla-değiştir hücreleri için callback. Verilmezse status sadece okunur StatusBadge. */
  onInlineUpdate?: (id: number, patch: { status?: string }) => Promise<void>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPrice(price?: number | null, currency?: string | null): string {
  if (price == null) return '-';
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : currency === 'TRY' ? '\u20BA' : '';
  return `${sym}${price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

type CurrencyVariant = 'info' | 'success' | 'warning';

function getCurrencyVariant(currency?: string | null): CurrencyVariant {
  if (currency === 'USD') return 'info';
  if (currency === 'EUR') return 'success';
  return 'warning';
}

export function QuotationTable({
  data,
  loading,
  onInlineUpdate,
  sortBy,
  sortOrder,
  onSortChange,
}: QuotationTableProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'quoteNo',
      label: 'TEKLIF NO',
      sortable: true,
      sortKey: 'quoteNo',
      render: (row: Quotation) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teklifler/${row.id}`);
          }}
          className="text-primary font-bold hover:underline text-left whitespace-nowrap"
        >
          {row.quoteNo}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'MUSTERI',
      render: (row: Quotation) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {row.customer?.companyName || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'quoteDate',
      label: 'TARIH',
      sortable: true,
      sortKey: 'quoteDate',
      render: (row: Quotation) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
          {formatDate(row.quoteDate)}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'GUZERGAH',
      className: 'min-w-[240px]',
      render: (row: Quotation) => (
        <RouteVisual
          originCountry={row.originCountry}
          pol={row.pol}
          destinationCountry={row.destinationCountry}
          pod={row.pod}
          transportMode={row.transportMode}
          size="sm"
        />
      ),
    },
    {
      key: 'price',
      label: 'FIYAT',
      sortable: true,
      sortKey: 'price',
      render: (row: Quotation) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {formatPrice(row.price, row.currency)}
          </span>
          {row.currency && (
            <Badge variant={getCurrencyVariant(row.currency)} size="sm">
              {row.currency}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'DURUM',
      sortable: true,
      sortKey: 'status',
      render: (row: Quotation) =>
        onInlineUpdate ? (
          <InlineEditSelect
            value={row.status}
            options={QUOTE_STATUS_OPTIONS}
            onSave={(next) => onInlineUpdate(row.id, { status: next })}
          />
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      key: 'assignedUser',
      label: 'TEMSILCI',
      render: (row: Quotation) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.assignedUser?.fullName || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-slate-50 dark:bg-slate-800/60 h-12" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 rounded w-1/6" />
              <div className="h-4 bg-slate-200 rounded w-1/6" />
              <div className="h-4 bg-slate-200 rounded w-1/12" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/12" />
              <div className="h-4 bg-slate-200 rounded w-1/12" />
              <div className="h-4 bg-slate-200 rounded w-1/8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <Table<Quotation & Record<string, unknown>>
        columns={columns}
        data={data as (Quotation & Record<string, unknown>)[]}
        onRowClick={(row) => navigate(`/teklifler/${row.id}`)}
        emptyMessage="Teklif bulunamadı"
        stickyFirstColumn
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
      />
    </div>
  );
}
