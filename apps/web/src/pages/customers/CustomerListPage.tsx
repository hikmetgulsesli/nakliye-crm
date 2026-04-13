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
    } catch (error) {
      console.error('Failed to fetch customers:', error);
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
          { label: 'Musteriler' },
        ]}
        title="Musteriler"
        subtitle="Tum musteri kayitlarini yonetin ve takip edin"
        action={
          <Button icon="add" onClick={() => navigate('/musteriler/yeni')}>
            Yeni Musteri
          </Button>
        }
      />

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
          title="Henuz musteri eklenmemis"
          description="Ilk musterinizi ekleyerek baslayabilirsiniz."
          action={
            <Button icon="add" onClick={() => navigate('/musteriler/yeni')}>
              Yeni Musteri Ekle
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
