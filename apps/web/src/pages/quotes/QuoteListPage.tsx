import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationFilters } from '@/components/quotations/QuotationFilters';
import { quotationService, type QuotationFilters as QuotationFiltersType } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Quotation } from '@nakliye-crm/shared';

const EMPTY_FILTERS: QuotationFiltersType = {};

export default function QuoteListPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuotationFiltersType>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<QuotationFiltersType>(EMPTY_FILTERS);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
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
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
    fetchUsers();
  }, []);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply = { ...appliedFilters };
      if (debouncedSearch) {
        filtersToApply.search = debouncedSearch;
      }
      const result = await quotationService.getAll(page, pageSize, filtersToApply);
      setQuotations(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, debouncedSearch, setTotal]);

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
        subtitle="Tum teklifleri yonetin ve takip edin"
        action={
          <Button icon="add" onClick={() => navigate('/teklifler/yeni')}>
            Yeni Teklif
          </Button>
        }
      />

      <QuotationFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        users={users}
      />

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
    </div>
  );
}
