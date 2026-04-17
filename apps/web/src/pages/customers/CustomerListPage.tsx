import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { customerService, type CustomerFilters as CustomerFiltersType } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@nakliye-crm/shared';

const EMPTY_FILTERS: CustomerFiltersType = {};

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
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

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const filtersToApply = { ...appliedFilters };
      // Use debounced search for auto-search
      if (debouncedSearch) {
        filtersToApply.search = debouncedSearch;
      }
      const result = await customerService.getAll(page, pageSize, filtersToApply);
      setCustomers(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Müşteriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, debouncedSearch, setTotal]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

      <CustomerFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        users={users}
      />

      {!loading && customers.length === 0 ? (
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
      ) : (
        <>
          <CustomerTable data={customers} loading={loading} />

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
