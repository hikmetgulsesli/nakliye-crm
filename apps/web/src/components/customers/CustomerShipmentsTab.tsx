import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, EmptyState, Skeleton } from '@/components/ui';
import { shipmentService, type Shipment, STATUS_LABELS, STATUS_COLORS } from '@/services/shipment.service';

interface CustomerShipmentsTabProps {
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

export function CustomerShipmentsTab({ customerId }: CustomerShipmentsTabProps) {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await shipmentService.list(1, 100, { customerId });
        setShipments(res.data);
      } catch (error) {
        console.error('Failed to fetch customer shipments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
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

  if (shipments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <EmptyState
          icon="local_shipping"
          title="Henüz sevkiyat yok"
          description="Bu müşteriye ait sevkiyat kaydı bulunamadı."
          action={
            <Button
              icon="add"
              onClick={() => navigate(`/sevkiyatlar/yeni?customerId=${customerId}`)}
            >
              Yeni Sevkiyat Oluştur
            </Button>
          }
        />
      </div>
    );
  }

  const columns = [
    {
      key: 'shipmentNo',
      label: 'SEVKIYAT NO',
      render: (row: Shipment) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/sevkiyatlar/${row.id}`);
          }}
          className="text-primary font-bold hover:underline whitespace-nowrap"
        >
          {row.shipmentNo}
        </button>
      ),
    },
    {
      key: 'transportMode',
      label: 'TASIMA',
      render: (row: Shipment) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm">
          {row.transportMode || '-'}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'GUZERGAH',
      render: (row: Shipment) => (
        <div className="text-sm">
          <div className="text-slate-700 dark:text-slate-300">
            {row.originCountry || '-'} → {row.destinationCountry || '-'}
          </div>
          {(row.pol || row.pod) && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              {row.pol || '?'} → {row.pod || '?'}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'eta',
      label: 'ETA',
      render: (row: Shipment) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
          {formatDate(row.eta)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'DURUM',
      render: (row: Shipment) => (
        <span
          className={`inline-block px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
            STATUS_COLORS[row.status] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Sevkiyatlar
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            ({shipments.length})
          </span>
        </h3>
        <Button
          size="sm"
          icon="add"
          onClick={() => navigate(`/sevkiyatlar/yeni?customerId=${customerId}`)}
        >
          Yeni Sevkiyat
        </Button>
      </div>
      <Table<Shipment & Record<string, unknown>>
        columns={columns}
        data={shipments as (Shipment & Record<string, unknown>)[]}
        onRowClick={(row) => navigate(`/sevkiyatlar/${row.id}`)}
      />
    </div>
  );
}
