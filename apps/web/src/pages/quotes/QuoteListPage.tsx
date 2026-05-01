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
  if (status) out.status = status;
  if (transportMode) out.transportMode = transportMode;
  if (assignedUserId) out.assignedUserId = Number(assignedUserId);
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
  const { page, pageSize, totalPages, total, setPage, setTotal } = usePagination();

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

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply: QuotationFiltersType = { ...appliedFilters };
      if (debouncedSearch) filtersToApply.search = debouncedSearch;

      // View override
      const viewStatus = VIEW_TO_STATUS[activeView];
      if (viewStatus) filtersToApply.status = viewStatus;

      const useMine =
        activeView === 'mine' || (onlyMine && activeView === 'all');
      if (useMine && currentUserId) {
        filtersToApply.assignedUserId = currentUserId;
      }

      const result = await quotationService.getAll(page, pageSize, filtersToApply);
      setQuotations(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Teklifler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, debouncedSearch, activeView, onlyMine, currentUserId, setTotal]);

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
          filters={appliedFilters as Record<string, unknown>}
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
          />
        </div>
      )}
    </div>
  );
}
