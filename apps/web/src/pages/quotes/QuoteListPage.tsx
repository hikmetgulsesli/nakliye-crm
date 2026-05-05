import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SavedViewsTabs, type BuiltInView } from '@/components/shared/SavedViewsTabs';
import { SaveViewModal } from '@/components/shared/SaveViewModal';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationFilters } from '@/components/quotations/QuotationFilters';
import { quotationService, type QuotationFilters as QuotationFiltersType } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import { useSavedViewsStore } from '@/stores/savedViewsStore';
import type { Quotation } from '@nakliye-crm/shared';
import type { SavedView } from '@/services/saved-views.service';

const EMPTY_FILTERS: QuotationFiltersType = {};

type ViewId = 'all' | 'pending' | 'won' | 'lost' | 'mine';

const VIEW_TO_STATUS: Partial<Record<ViewId, string>> = {
  pending: 'Bekliyor',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
};

function filtersFromSearchParams(params: URLSearchParams): QuotationFiltersType {
  const out: QuotationFiltersType = {};
  const status = params.get('status');
  const transportMode = params.get('transportMode');
  const assignedUserId = params.get('assignedUserId');
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  const olderThanDays = params.get('olderThanDays');
  const expired = params.get('expired');
  if (status) out.status = status;
  if (transportMode) out.transportMode = transportMode;
  if (assignedUserId) out.assignedUserId = Number(assignedUserId);
  if (dateFrom) out.dateFrom = dateFrom;
  if (dateTo) out.dateTo = dateTo;
  if (olderThanDays) {
    const n = Number(olderThanDays);
    if (!Number.isNaN(n)) out.olderThanDays = n;
  }
  if (expired === '1' || expired === 'true') out.expired = true;
  return out;
}

function detectInitialView(params: URLSearchParams): ViewId {
  const status = params.get('status');
  if (status === 'Bekliyor') return 'pending';
  if (status === 'Kazanıldı') return 'won';
  if (status === 'Kaybedildi') return 'lost';
  return 'all';
}

export default function QuoteListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUserId, onlyMine, setOnlyMine } = useOnlyMinePref('quotations');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFromUrl = filtersFromSearchParams(searchParams);
  const [filters, setFilters] = useState<QuotationFiltersType>(initialFromUrl);
  const [appliedFilters, setAppliedFilters] = useState<QuotationFiltersType>(initialFromUrl);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>(detectInitialView(searchParams));
  const [activeUserViewId, setActiveUserViewId] = useState<number | undefined>();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const fetchSavedViewsIfNeeded = useSavedViewsStore((s) => s.fetchIfNeeded);
  const { page, pageSize, totalPages, total, setPage, setPageSize, setTotal } = usePagination();
  const { sortBy, sortOrder, setSort } = useSort({ sortBy: 'createdAt', sortOrder: 'desc' });

  const debouncedSearch = useDebounce(filters.search, 400);

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

  useEffect(() => {
    fetchSavedViewsIfNeeded();
  }, [fetchSavedViewsIfNeeded]);

  // Sidebar saved view nav'inda URL degisir; mount'lu sayfa tekrar bootstrap
  useEffect(() => {
    const next = filtersFromSearchParams(searchParams);
    setFilters(next);
    setAppliedFilters(next);
    const vId = searchParams.get('view');
    setActiveUserViewId(vId ? Number(vId) : undefined);
    setActiveView(detectInitialView(searchParams));
    // Dashboard alarm linklerinden gelen onlyMine=1 hook tercihini override eder
    const onlyMineParam = searchParams.get('onlyMine');
    if (onlyMineParam === '1' || onlyMineParam === 'true') {
      setOnlyMine(true);
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Tarih bar artik drawer disinda anlik calisiyor — dateFrom/dateTo
  // degisince appliedFilters'a otomatik aktar.
  useEffect(() => {
    setAppliedFilters((prev) => ({
      ...prev,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }));
    setPage(1);
  }, [filters.dateFrom, filters.dateTo]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply: QuotationFiltersType = { ...appliedFilters };
      if (debouncedSearch) filtersToApply.search = debouncedSearch;

      // View override
      const viewStatus = VIEW_TO_STATUS[activeView];
      if (viewStatus) filtersToApply.status = viewStatus;

      // "Sadece benim" cubuk her tab'da gecerli olmali — Bekliyor/Kazanildi/
      // Kaybedildi sekmelerine girilse de checkbox'i kapatmadigimiz surece
      // filtre uygulanmaya devam eder.
      const useMine = activeView === 'mine' || onlyMine;
      if (useMine && currentUserId) {
        filtersToApply.assignedUserId = currentUserId;
      }

      const result = await quotationService.getAll(page, pageSize, {
        ...filtersToApply,
        sortBy,
        sortOrder,
      });
      setQuotations(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Teklifler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, appliedFilters, debouncedSearch, activeView, onlyMine, currentUserId, setTotal]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  async function handleInlineUpdate(id: number, patch: { status?: string }) {
    // Optimistic: tabloyu hemen guncelle
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    try {
      await quotationService.update(id, patch);
    } catch (err) {
      // Revert + sade hata
      await fetchQuotations();
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
    const f = view.filters as QuotationFiltersType;
    setFilters(f);
    setAppliedFilters(f);
    setActiveView('all');
    setActiveUserViewId(view.id);
    setPage(1);
  }

  const views = useMemo<BuiltInView[]>(() => {
    const list: BuiltInView[] = [
      { id: 'all', label: 'Tümü' },
      { id: 'pending', label: 'Bekliyor', color: 'var(--warning)' },
      { id: 'won', label: 'Kazanıldı', color: 'var(--success)' },
      { id: 'lost', label: 'Kaybedildi', color: 'var(--danger)' },
    ];
    if (currentUserId) {
      list.push({ id: 'mine', label: 'Benim tekliflerim', color: 'var(--accent)' });
    }
    return list.map((v) => (v.id === activeView ? { ...v, count: total } : v));
  }, [currentUserId, activeView, total]);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Teklifler' },
        ]}
        title="Teklifler"
        subtitle="Tüm teklifleri yönetin ve takip edin"
        action={
          <Button icon="add" onClick={() => navigate('/teklifler/yeni')}>
            Yeni Teklif
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between dark:bg-red-500/10 dark:border-red-500/30">
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-token-border bg-token-bg-panel">
        <SavedViewsTabs
          views={views}
          activeId={activeView}
          onChange={handleViewChange}
          resource="quotations"
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
          resource="quotations"
          filters={(() => {
            const eff: Record<string, unknown> = { ...appliedFilters };
            if (debouncedSearch) eff.search = debouncedSearch;
            const viewStatus = VIEW_TO_STATUS[activeView];
            if (viewStatus) eff.status = viewStatus;
            if ((activeView === 'mine' || onlyMine) && currentUserId) {
              eff.assignedUserId = currentUserId;
            }
            return eff;
          })()}
          onSaved={(id) => setActiveUserViewId(id)}
        />

        <div className="border-b border-token-border bg-token-bg-panel p-3">
          <QuotationFilters
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

        {!loading && quotations.length === 0 ? (
          <EmptyState
            icon="description"
            title="Henuz teklif olusturulmamis"
            description="Ilk teklifinizi olusturarak baslayabilirsiniz."
            action={
              <Button icon="add" onClick={() => navigate('/teklifler/yeni')}>
                Yeni Teklif Oluştur
              </Button>
            }
          />
        ) : (
          <QuotationTable
            data={quotations}
            loading={loading}
            onInlineUpdate={handleInlineUpdate}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(by, order) => {
              setSort(by, order);
              setPage(1);
            }}
          />
        )}
      </div>

      {quotations.length > 0 && (
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
