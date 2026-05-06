import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, EmptyState, Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/config/api';
import type { Quotation, PaginatedResponse } from '@nakliye-crm/shared';

interface CustomerQuotesTabProps {
  customerId: number;
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
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function CustomerQuotesTab({ customerId }: CustomerQuotesTabProps) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const { data } = await api.get<PaginatedResponse<Quotation>>(
          '/quotations',
          { params: { customerId, pageSize: 50 } },
        );
        setQuotes(data.data);
      } catch (error) {
        console.error('Failed to fetch customer quotes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuotes();
  }, [customerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <EmptyState
          icon="request_quote"
          title="Henuz teklif yok"
          description="Bu müşteriye ait teklif bulunamadı."
          action={
            <Button
              icon="add"
              onClick={() => navigate(`/teklifler/yeni?customerId=${customerId}`)}
            >
              Yeni Teklif Oluştur
            </Button>
          }
        />
      </div>
    );
  }

  const columns = [
    {
      key: 'quoteNo',
      label: 'TEKLİF NO',
      render: (row: Quotation) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teklifler/${row.id}`);
          }}
          className="text-primary font-bold hover:underline"
        >
          {row.quoteNo}
        </button>
      ),
    },
    {
      key: 'quoteDate',
      label: 'TARİH',
      render: (row: Quotation) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">{formatDate(row.quoteDate)}</span>
      ),
    },
    {
      key: 'transportMode',
      label: 'TAŞIMA MODU',
      render: (row: Quotation) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">{row.transportMode || '-'}</span>
      ),
    },
    {
      key: 'route',
      label: 'GÜZERGAH',
      render: (row: Quotation) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.originCountry && row.destinationCountry
            ? `${row.originCountry} → ${row.destinationCountry}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'FİYAT',
      render: (row: Quotation) => (
        <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
          {formatPrice(row.price, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'DURUM',
      render: (row: Quotation) => <StatusBadge status={row.status} />,
    },
    {
      key: 'assignedUser',
      label: 'TEMSİLCİ',
      render: (row: Quotation) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.assignedUser?.fullName || '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Teklifler
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            ({quotes.length})
          </span>
        </h3>
        <Button
          size="sm"
          icon="add"
          onClick={() => navigate(`/teklifler/yeni?customerId=${customerId}`)}
        >
          Yeni Teklif
        </Button>
      </div>
      <Table<Quotation & Record<string, unknown>>
        columns={columns}
        data={quotes as (Quotation & Record<string, unknown>)[]}
        onRowClick={(row) => navigate(`/teklifler/${row.id}`)}
      />
    </div>
  );
}
