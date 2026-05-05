import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SavedViewsTabs, type BuiltInView } from '@/components/shared/SavedViewsTabs';
import { SaveViewModal } from '@/components/shared/SaveViewModal';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { customerService, type CustomerFilters as CustomerFiltersType } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import type { Customer } from '@nakliye-crm/shared';
import type { SavedView } from '@/services/saved-views.service';

const EMPTY_FILTERS: CustomerFiltersType = {};

type ViewId = 'all' | 'high' | 'mine' | 'deleted';

const FILTER_KEYS: (keyof CustomerFiltersType)[] = [
  'search',
  'status',
  'potential',
  'transportMode',
  'serviceType',
  'originCountry',
  'destinationCountry',
  'incoterm',
  'source',
  'startDate',
  'endDate',
  'uncontactedDays',
  'deleted',
];

function filtersFromSearchParams(params: URLSearchParams): CustomerFiltersType {
  const out: Record<string, unknown> = {};
  for (const key of FILTER_KEYS) {
    const v = params.get(key);
    if (v === null) continue;
    if (key === 'deleted') out[key] = v === 'true';
    else if (key === 'uncontactedDays') {
      const n = Number(v);
      if (!Number.isNaN(n)) out[key] = n;
    } else out[key] = v;
  }
  const aid = params.get('assignedUserId');
  if (aid) out.assignedUserId = Number(aid);
  return out as CustomerFiltersType;
}

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { isUser, currentUserId, onlyMine, setOnlyMine } = useOnlyMinePref('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFromUrl = useMemo(() => filtersFromSearchParams(searchParams), []);
  const [filters, setFilters] = useState<CustomerFiltersType>(initialFromUrl);
  const [appliedFilters, setAppliedFilters] = useState<CustomerFiltersType>(initialFromUrl);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>(
    initialFromUrl.deleted ? 'deleted' : isUser && onlyMine ? 'mine' : 'all',
  );
  const initialViewId = searchParams.get('view');
  const [activeUserViewId, setActiveUserViewId] = useState<number | undefined>(
    initialViewId ? Number(initialViewId) : undefined,
  );
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const fetchSavedViewsIfNeeded = useSavedViewsStore((s) => s.fetchIfNeeded);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const { page, pageSize, totalPages, total, setPage, setPageSize, setTotal } = usePagination();
  const { sortBy, sortOrder, setSort } = useSort({ sortBy: 'updatedAt', sortOrder: 'desc' });

  const debouncedSearch = useDebounce(filters.search, 400);

  // Fetch users for filter dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({ value: u.id.toString(), label: u.fullName })),
        );
      } catch (err) {
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

  // Saved views'i bir kez cek
  useEffect(() => {
    fetchSavedViewsIfNeeded();
  }, [fetchSavedViewsIfNeeded]);

  // Sidebar'dan saved view tıklandıkça URL degisir; component zaten mount'lu
  // oldugu icin state'i URL'e gore tekrar bootstrap edelim.
  useEffect(() => {
    const next = filtersFromSearchParams(searchParams);
    setFilters(next);
    setAppliedFilters(next);
    const vId = searchParams.get('view');
    setActiveUserViewId(vId ? Number(vId) : undefined);
    // Dashboard alarm linklerinden gelen onlyMine=1 hook tercihini override eder
    const onlyMineParam = searchParams.get('onlyMine');
    if (onlyMineParam === '1' || onlyMineParam === 'true') {
      setOnlyMine(true);
    }
    if (next.deleted) setActiveView('deleted');
    else if (vId) setActiveView('all');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Tarih bar artik drawer disinda anlik calisiyor — startDate/endDate
  // degisince appliedFilters'a otomatik aktar (drawer "Uygula" beklemeden).
  useEffect(() => {
    setAppliedFilters((prev) => ({
      ...prev,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }));
    setPage(1);
  }, [filters.startDate, filters.endDate]);

  const showDeleted = activeView === 'deleted';

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply: CustomerFiltersType = { ...appliedFilters };
      if (debouncedSearch) filtersToApply.search = debouncedSearch;

      // Saved view'a gore filter override
      if (activeView === 'deleted') {
        filtersToApply.deleted = true;
      }
      if (activeView === 'high') {
        filtersToApply.potential = 'Yüksek';
      }
      if (activeView === 'mine' && currentUserId) {
        filtersToApply.assignedUserId = currentUserId;
      } else if (onlyMine && currentUserId && activeView !== 'deleted') {
        // checkbox tercihi de ek katman
        filtersToApply.assignedUserId = currentUserId;
      }

      const result = await customerService.getAll(page, pageSize, {
        ...filtersToApply,
        sortBy,
        sortOrder,
      });
      setCustomers(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Müşteriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, appliedFilters, debouncedSearch, activeView, onlyMine, currentUserId, setTotal]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleRestore(id: number) {
    setRestoringId(id);
    try {
      await customerService.restore(id);
      await fetchCustomers();
    } catch (err) {
      setError('Müşteri geri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setRestoringId(null);
    }
  }

  async function handleInlineUpdate(id: number, patch: { status?: string; potential?: string }) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? ({ ...c, ...patch } as Customer) : c)),
    );
    try {
      await customerService.update(id, patch);
    } catch (err) {
      await fetchCustomers();
      throw err;
    }
  }

  function handleApplyFilters() {
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleViewChange(id: string) {
    setActiveView(id as ViewId);
    setActiveUserViewId(undefined);
    setPage(1);
  }

  function handleUserViewSelect(view: SavedView) {
    // Kullanici görünümü filtreleri uygula
    const f = view.filters as CustomerFiltersType;
    setFilters(f);
    setAppliedFilters(f);
    setActiveView('all');
    setActiveUserViewId(view.id);
    setPage(1);
  }

  const views = useMemo<BuiltInView[]>(() => {
    const list: BuiltInView[] = [
      { id: 'all', label: 'Tümü' },
      { id: 'high', label: 'Yüksek potansiyel', color: 'var(--success)' },
    ];
    if (currentUserId) {
      list.push({ id: 'mine', label: 'Benim müşterilerim', color: 'var(--accent)' });
    }
    if (isAdmin) {
      list.push({ id: 'deleted', label: 'Silinmiş', color: 'var(--warning)' });
    }
    // Aktif view'in count'u: pagination total
    return list.map((v) => (v.id === activeView ? { ...v, count: total } : v));
  }, [currentUserId, isAdmin, activeView, total]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Müşteriler' },
        ]}
        title="Müşteriler"
        subtitle="Tüm müşteri kayitlarini yönetin ve takip edin"
        action={
          <Button icon="add" onClick={() => navigate('/musteriler/yeni')}>
            Yeni Müşteri
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between dark:bg-red-500/10 dark:border-red-500/30">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Kapat"
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-token-border bg-token-bg-panel">
        <SavedViewsTabs
          views={views}
          activeId={activeView}
          onChange={handleViewChange}
          resource="customers"
          activeUserViewId={activeUserViewId}
          onUserViewSelect={handleUserViewSelect}
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
          resource="customers"
          // Built-in tab turevsel filterlari + onlyMine'i dahil et ki
          // kaydedilen görünüm gercekten görünen sonucu yansitsin.
          filters={(() => {
            const eff: Record<string, unknown> = { ...appliedFilters };
            if (debouncedSearch) eff.search = debouncedSearch;
            if (activeView === 'high') eff.potential = 'Yüksek';
            if (activeView === 'deleted') eff.deleted = true;
            if (
              (activeView === 'mine' || (onlyMine && activeView !== 'deleted')) &&
              currentUserId
            ) {
              eff.assignedUserId = currentUserId;
            }
            return eff;
          })()}
          onSaved={(id) => setActiveUserViewId(id)}
        />

        {!showDeleted && (
          <div className="border-b border-token-border bg-token-bg-panel p-3">
            <CustomerFilters
              filters={filters}
              onChange={setFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              users={users}
              showOnlyMine
              onlyMine={onlyMine}
              onOnlyMineChange={(next) => {
                setOnlyMine(next);
                setPage(1);
              }}
              hideAssignedUserSelect={onlyMine || activeView === 'mine'}
            />
          </div>
        )}

        {!loading && customers.length === 0 ? (
          <div className="bg-token-bg-panel">
            {showDeleted ? (
              <EmptyState
                icon="delete"
                title="Silinmiş müşteri bulunamadı"
                description="Geri yüklenecek bir kayit yok."
              />
            ) : (
              <EmptyState
                icon="group"
                title="Henuz müşteri eklenmemis"
                description="Ilk müşterinizi ekleyerek baslayabilirsiniz."
                action={
                  <Button icon="add" onClick={() => navigate('/musteriler/yeni')}>
                    Yeni Müşteri Ekle
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <>
            {customers.length > 0 && (
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
            <CustomerTable
              data={customers}
              loading={loading}
              mode={showDeleted ? 'deleted' : 'active'}
              onRestore={showDeleted ? handleRestore : undefined}
              restoringId={restoringId}
              onInlineUpdate={!showDeleted ? handleInlineUpdate : undefined}
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

      {customers.length > 0 && (
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
