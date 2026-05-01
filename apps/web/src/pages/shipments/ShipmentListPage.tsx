import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton, EmptyState, Select } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SavedViewsTabs, type SavedView } from '@/components/shared/SavedViewsTabs';
import {
  shipmentService,
  type Shipment,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/shipment.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import { cn } from '@/utils/cn';

type ViewId = 'all' | 'active' | 'transit' | 'delivered' | 'mine';

const VIEW_TO_STATUS: Partial<Record<ViewId, string>> = {
  transit: 'in_transit',
  delivered: 'delivered',
};

const ACTIVE_STATUSES = new Set(['booked', 'loading', 'in_transit', 'at_destination', 'customs_cleared']);

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const { onlyMine, setOnlyMine, currentUserId } = useOnlyMinePref('shipments');
  const [items, setItems] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeView, setActiveView] = useState<ViewId>('all');
  const debounced = useDebounce(search, 400);

  async function fetchData() {
    setLoading(true);
    try {
      const useMine =
        activeView === 'mine' || (onlyMine && activeView === 'all');
      const viewStatus = VIEW_TO_STATUS[activeView];
      const res = await shipmentService.list(1, 50, {
        search: debounced || undefined,
        // saved view oncelikli; ek manuel status filtre korunsun
        status: viewStatus ?? statusFilter ?? undefined,
        assignedUserId: useMine && currentUserId ? currentUserId : undefined,
      });
      let data = res.data;
      // "Aktif" view: birkac status'u toplayan turetilmis filter — backend tek
      // status param ile sinirli, bu yuzden client tarafinda filtreliyoruz.
      if (activeView === 'active') {
        data = data.filter((s) => ACTIVE_STATUSES.has(s.status));
      }
      setItems(data);
      setTotal(activeView === 'active' ? data.length : res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, statusFilter, onlyMine, currentUserId, activeView]);

  const views = useMemo<SavedView[]>(() => {
    const list: SavedView[] = [
      { id: 'all', label: 'Tümü' },
      { id: 'active', label: 'Aktif', color: 'var(--info)' },
      { id: 'transit', label: 'Transit', color: 'var(--warning)' },
      { id: 'delivered', label: 'Teslim', color: 'var(--success)' },
    ];
    if (currentUserId) {
      list.push({ id: 'mine', label: 'Benim sevkiyatlarım', color: 'var(--accent)' });
    }
    return list.map((v) => (v.id === activeView ? { ...v, count: total } : v));
  }, [currentUserId, activeView, total]);

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

      <div className="overflow-hidden rounded-lg border border-token-border bg-token-bg-panel">
        <SavedViewsTabs
          views={views}
          activeId={activeView}
          onChange={(id) => setActiveView(id as ViewId)}
        />

        <div className="border-b border-token-border bg-token-bg-panel p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
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
            <label className="md:col-span-3 inline-flex cursor-pointer select-none items-center gap-2 rounded-md bg-token-bg-subtle px-3 py-2 text-sm font-medium text-token-muted transition-colors hover:bg-token-bg-hover">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="size-4 rounded border-token-border text-primary focus:ring-2 focus:ring-primary/40"
              />
              <span className="whitespace-nowrap">Sadece kendi sevkiyatlarım</span>
            </label>
            <div className="md:col-span-1 text-right text-sm text-token-muted">
              Toplam: {total}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-token-bg-subtle text-left text-token-subtle">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">No</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">Müşteri</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">Güzergah</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">ETA</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-token-border">
                {items.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/sevkiyatlar/${s.id}`)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-token-bg-subtle',
                    )}
                    style={{ height: 'var(--row-h)' }}
                  >
                    <td className="px-4 font-mono text-[12px] font-medium text-primary">
                      {s.shipmentNo}
                      {s.blNumber && (
                        <div className="text-[11px] text-token-subtle">BL: {s.blNumber}</div>
                      )}
                    </td>
                    <td className="px-4 text-token-text">{s.customer?.companyName || '-'}</td>
                    <td className="px-4 text-[12px] text-token-muted">
                      {s.originCountry || '-'} → {s.destinationCountry || '-'}
                      {(s.pol || s.pod) && (
                        <div className="text-[11px] text-token-subtle">
                          {s.pol || '?'} → {s.pod || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 text-[12px] text-token-muted">
                      {s.eta ? new Date(s.eta).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-[11px] font-medium ${STATUS_COLORS[s.status] || 'bg-token-bg-subtle text-token-muted'}`}
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
    </div>
  );
}
