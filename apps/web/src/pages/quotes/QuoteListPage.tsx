import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationFilters } from '@/components/quotations/QuotationFilters';
import { quotationService, type QuotationFilters as QuotationFiltersType } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import type { Quotation } from '@nakliye-crm/shared';

const EMPTY_FILTERS: QuotationFiltersType = {};

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
  const { page, pageSize, totalPages, total, setPage, setTotal } = usePagination();

  const debouncedSearch = useDebounce(filters.search, 400);

  // Fetch users for filter dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err) {
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply: QuotationFiltersType = { ...appliedFilters };
      if (debouncedSearch) {
        filtersToApply.search = debouncedSearch;
      }
      if (onlyMine && currentUserId) {
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
  }, [page, pageSize, appliedFilters, debouncedSearch, onlyMine, currentUserId, setTotal]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  function handleApplyFilters() {
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

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
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

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
        hideAssignedUserSelect={onlyMine}
      />

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
        <>
          <QuotationTable data={quotations} loading={loading} />

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
