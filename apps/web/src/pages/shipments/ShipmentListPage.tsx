import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, Skeleton, EmptyState, Select, Pagination, Table } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SavedViewsTabs, type BuiltInView } from '@/components/shared/SavedViewsTabs';
import { SaveViewModal } from '@/components/shared/SaveViewModal';
import { DateRangeQuickFilter } from '@/components/shared/DateRangeQuickFilter';
import {
  shipmentService,
  type Shipment,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/shipment.service';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import type { SavedView } from '@/services/saved-views.service';

type ViewId = 'all' | 'active' | 'transit' | 'delivered' | 'mine';

const VIEW_TO_STATUS: Partial<Record<ViewId, string>> = {
  transit: 'in_transit',
  delivered: 'delivered',
};

const ACTIVE_STATUSES = new Set(['booked', 'loading', 'in_transit', 'at_destination', 'customs_cleared']);

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlyMine, setOnlyMine, currentUserId } = useOnlyMinePref('shipments');
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { page, pageSize, totalPages, total, setPage, setPageSize, setTotal } = usePagination();
  const { sortBy, sortOrder, setSort } = useSort({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [startDate, setStartDate] = useState<string | undefined>(
    searchParams.get('startDate') ?? undefined,
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    searchParams.get('endDate') ?? undefined,
  );
  const [activeView, setActiveView] = useState<ViewId>('all');
  const initialViewId = searchParams.get('view');
  const [activeUserViewId, setActiveUserViewId] = useState<number | undefined>(
    initialViewId ? Number(initialViewId) : undefined,
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const fetchSavedViewsIfNeeded = useSavedViewsStore((s) => s.fetchIfNeeded);
  const debounced = useDebounce(search, 400);

  useEffect(() => {
    fetchSavedViewsIfNeeded();
  }, [fetchSavedViewsIfNeeded]);

  // Sidebar saved view nav'inda URL degisirse state'i tekrar bootstrap et.
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setStatusFilter(searchParams.get('status') ?? '');
    setStartDate(searchParams.get('startDate') ?? undefined);
    setEndDate(searchParams.get('endDate') ?? undefined);
    const vId = searchParams.get('view');
    setActiveUserViewId(vId ? Number(vId) : undefined);
    if (vId) setActiveView('all');
  }, [searchParams]);

  async function fetchData() {
    setLoading(true);
    try {
      // "Sadece benim sevkiyatlarim" tum tab'larda (Tumu/Aktif/Transit/Teslim)
      // gecerli olmali — checkbox'i kapatmadigimiz surece filtre korunur.
      const useMine = activeView === 'mine' || onlyMine;
      const viewStatus = VIEW_TO_STATUS[activeView];
      const res = await shipmentService.list(page, pageSize, {
        search: debounced || undefined,
        status: viewStatus ?? statusFilter ?? undefined,
        assignedUserId: useMine && currentUserId ? currentUserId : undefined,
        startDate,
        endDate,
        sortBy,
        sortOrder,
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
  }, [page, pageSize, sortBy, sortOrder, debounced, statusFilter, onlyMine, currentUserId, activeView, startDate, endDate]);

  const views = useMemo<BuiltInView[]>(() => {
    const list: BuiltInView[] = [
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
          onChange={(id) => {
            setActiveView(id as ViewId);
            setActiveUserViewId(undefined);
          }}
          resource="shipments"
          activeUserViewId={activeUserViewId}
          onUserViewSelect={(view: SavedView) => {
            const f = view.filters as { search?: string; status?: string };
            setSearch(f.search ?? '');
            setStatusFilter(f.status ?? '');
            setActiveView('all');
            setActiveUserViewId(view.id);
          }}
          trailing={
            <button
              type="button"
              onClick={() => setSaveModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-token-muted hover:bg-token-bg-hover hover:text-token-text"
            >
              <Icon name="bookmark_add" size="sm" className="!text-[14px]" />
              Görünümü kaydet
            </button>
          }
        />

        <SaveViewModal
          open={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          resource="shipments"
          filters={{ search, status: statusFilter, onlyMine }}
          onSaved={(id) => setActiveUserViewId(id)}
        />

        <div className="space-y-3 border-b border-token-border bg-token-bg-panel p-3">
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

          <DateRangeQuickFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
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
          <>
            {items.length > 0 && (
              <div className="border-b border-token-border bg-token-bg-panel/60 px-4 py-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
            <Table<Shipment & Record<string, unknown>>
              columns={[
                {
                  key: 'shipmentNo',
                  label: 'NO',
                  sortable: true,
                  sortKey: 'shipmentNo',
                  render: (s: Shipment) => (
                    <div>
                      <div className="font-mono text-[12px] font-medium text-primary whitespace-nowrap">
                        {s.shipmentNo}
                      </div>
                      {s.blNumber && (
                        <div className="text-[11px] text-token-subtle">BL: {s.blNumber}</div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'customer',
                  label: 'MÜŞTERİ',
                  className: 'max-w-[260px]',
                  render: (s: Shipment) => (
                    <span
                      title={s.customer?.companyName || ''}
                      className="block truncate text-token-text"
                    >
                      {s.customer?.companyName || '-'}
                    </span>
                  ),
                },
                {
                  key: 'route',
                  label: 'GÜZERGAH',
                  render: (s: Shipment) => (
                    <div className="text-[12px] text-token-muted">
                      {s.originCountry || '-'} → {s.destinationCountry || '-'}
                      {(s.pol || s.pod) && (
                        <div className="text-[11px] text-token-subtle">
                          {s.pol || '?'} → {s.pod || '?'}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'eta',
                  label: 'ETA',
                  sortable: true,
                  sortKey: 'eta',
                  render: (s: Shipment) => (
                    <span className="text-[12px] text-token-muted whitespace-nowrap">
                      {s.eta ? new Date(s.eta).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'DURUM',
                  sortable: true,
                  sortKey: 'status',
                  render: (s: Shipment) => (
                    <span
                      className={`inline-block px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap ${
                        STATUS_COLORS[s.status] || 'bg-token-bg-subtle text-token-muted'
                      }`}
                    >
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  ),
                },
              ]}
              data={items as (Shipment & Record<string, unknown>)[]}
              onRowClick={(s) => navigate(`/sevkiyatlar/${s.id}`)}
              emptyMessage="Sevkiyat bulunamadı"
              stickyFirstColumn
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(by, order) => {
                setSort(by, order);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
