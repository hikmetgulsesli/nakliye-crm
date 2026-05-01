import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton, EmptyState, Select } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  shipmentService,
  type Shipment,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/shipment.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const { onlyMine, setOnlyMine, currentUserId } = useOnlyMinePref('shipments');
  const [items, setItems] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounced = useDebounce(search, 400);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await shipmentService.list(1, 50, {
        search: debounced || undefined,
        status: statusFilter || undefined,
        assignedUserId: onlyMine && currentUserId ? currentUserId : undefined,
      });
      setItems(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, statusFilter, onlyMine, currentUserId]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Sevkiyatlar' }]}
        title="Sevkiyatlar"
        action={
          <Button variant="primary" icon="add" onClick={() => navigate('/sevkiyatlar/yeni')}>
            Yeni Sevkiyat
          </Button>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BL/AWB/Sevkiyat no ara..."
            />
          </div>
          <div className="md:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Tüm durumlar' },
                ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
          <label className="md:col-span-3 inline-flex cursor-pointer select-none items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="size-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-600"
            />
            <span className="whitespace-nowrap">Sadece kendi sevkiyatlarım</span>
          </label>
          <div className="md:col-span-1 text-right text-sm text-slate-500 dark:text-slate-400">
            Toplam: {total}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="local_shipping"
          title="Henüz sevkiyat yok"
          description="Teklif 'Kazanıldı' statüsüne geçince otomatik oluşur veya manuel ekleyebilirsiniz."
          action={
            <Button variant="primary" icon="add" onClick={() => navigate('/sevkiyatlar/yeni')}>
              Yeni Sevkiyat
            </Button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">No</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Müşteri</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Güzergah</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ETA</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/sevkiyatlar/${s.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {s.shipmentNo}
                    {s.blNumber && (
                      <div className="text-xs text-slate-500">BL: {s.blNumber}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {s.customer?.companyName || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {s.originCountry || '-'} → {s.destinationCountry || '-'}
                    {(s.pol || s.pod) && (
                      <div>
                        {s.pol || '?'} → {s.pod || '?'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {s.eta ? new Date(s.eta).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[s.status] || 'bg-slate-100'}`}
                    >
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
