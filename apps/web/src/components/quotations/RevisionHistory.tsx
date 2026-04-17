import { Table } from '@/components/ui';
import type { QuotationRevision } from '@nakliye-crm/shared';

interface RevisionHistoryProps {
  revisions: QuotationRevision[];
  loading?: boolean;
}

/** Human-readable field names */
const FIELD_LABELS: Record<string, string> = {
  price: 'Fiyat',
  currency: 'Para Birimi',
  status: 'Durum',
  pol: 'Yukleme Noktasi',
  pod: 'Varış Noktasi',
  originCountry: 'Çıkış Ülkesi',
  destinationCountry: 'Varış Ülkesi',
  transportMode: 'Taşıma Modu',
  serviceType: 'Servis Tipi',
  incoterm: 'Incoterms',
  quoteDate: 'Teklif Tarihi',
  validityDate: 'Geçerlilik Tarihi',
  priceNote: 'Fiyat Notu',
  lossReason: 'Kaybedilme Nedeni',
  assignedUserId: 'Temsilci',
};

function formatFieldName(field: string): string {
  return FIELD_LABELS[field] || field;
}

function formatValue(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('tr-TR');
  return String(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderChanges(changedFields: Record<string, { old: unknown; new: unknown }>): React.ReactNode {
  const entries = Object.entries(changedFields);
  if (entries.length === 0) return <span className="text-slate-400 dark:text-slate-500">-</span>;

  return (
    <div className="space-y-1">
      {entries.map(([field, change]) => (
        <div key={field} className="text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">{formatFieldName(field)}: </span>
          <span className="text-red-500 line-through">{formatValue(change.old)}</span>
          <span className="text-slate-400 dark:text-slate-500 mx-1">&rarr;</span>
          <span className="text-emerald-600 font-medium">{formatValue(change.new)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevisionHistory({ revisions, loading }: RevisionHistoryProps) {
  const columns = [
    {
      key: 'revisionNo',
      label: 'REVIZE NO',
      render: (row: QuotationRevision) => (
        <span className="font-bold text-slate-900 dark:text-slate-100">#{row.revisionNo}</span>
      ),
    },
    {
      key: 'revisedAt',
      label: 'TARIH',
      render: (row: QuotationRevision) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
          {formatDate(row.revisedAt)}
        </span>
      ),
    },
    {
      key: 'revisedBy',
      label: 'GUNCELLEYEN',
      render: (row: QuotationRevision) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.revisedBy?.fullName || '-'}
        </span>
      ),
    },
    {
      key: 'changedFields',
      label: 'DEGISIKLIK',
      className: 'min-w-[300px]',
      render: (row: QuotationRevision) => renderChanges(row.changedFields),
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-slate-200 rounded w-16" />
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
        Henuz revize geçmişi bulunmuyor
      </div>
    );
  }

  return (
    <Table<QuotationRevision & Record<string, unknown>>
      columns={columns}
      data={revisions as (QuotationRevision & Record<string, unknown>)[]}
      emptyMessage="Revize geçmişi bulunamadı"
    />
  );
}
