import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Customer } from '@nakliye-crm/shared';

interface CustomerTableProps {
  data: Customer[];
  loading?: boolean;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function CustomerTable({ data, loading }: CustomerTableProps) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'companyName',
      label: 'FIRMA ADI',
      render: (row: Customer) => (
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
        <span className="text-slate-700 dark:text-slate-300">{row.phone}</span>
      ),
    },
    {
      key: 'status',
      label: 'DURUM',
      render: (row: Customer) => <StatusBadge status={row.status} />,
    },
    {
      key: 'potential',
      label: 'POTANSIYEL',
      render: (row: Customer) =>
        row.potential ? <StatusBadge status={row.potential} /> : <span className="text-slate-400 dark:text-slate-500">-</span>,
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
        onRowClick={(row) => navigate(`/musteriler/${row.id}`)}
        emptyMessage="Musteri bulunamadi"
      />
    </div>
  );
}
