import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, Icon } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { customerService, type CustomerFilters as CustomerFiltersType } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import { cn } from '@/utils/cn';
import type { Customer } from '@nakliye-crm/shared';

const EMPTY_FILTERS: CustomerFiltersType = {};

export default function CustomerListPage() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { currentUserId, onlyMine, setOnlyMine } = useOnlyMinePref('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
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
      const filtersToApply: CustomerFiltersType = { ...appliedFilters };
      // Use debounced search for auto-search
      if (debouncedSearch) {
        filtersToApply.search = debouncedSearch;
      }
      if (showDeleted) {
        filtersToApply.deleted = true;
      }
      // "Sadece kendi kayıtlarım" işaretliyse, tüm rollerde geçerli
      if (onlyMine && currentUserId) {
        filtersToApply.assignedUserId = currentUserId;
      }
      const result = await customerService.getAll(page, pageSize, filtersToApply);
      setCustomers(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Müşteriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, debouncedSearch, showDeleted, onlyMine, currentUserId, setTotal]);

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

  function toggleDeletedView(next: boolean) {
    if (next === showDeleted) return;
    setShowDeleted(next);
    setPage(1);
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

      {isAdmin && (
        <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => toggleDeletedView(false)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              !showDeleted
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name="group" size="sm" />
            Aktif Müşteriler
          </button>
          <button
            type="button"
            onClick={() => toggleDeletedView(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              showDeleted
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name="delete" size="sm" />
            Silinmiş Müşteriler
          </button>
        </div>
      )}

      {!showDeleted && (
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
          hideAssignedUserSelect={onlyMine}
        />
      )}

      {!loading && customers.length === 0 ? (
        showDeleted ? (
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
        )
      ) : (
        <>
          <CustomerTable
            data={customers}
            loading={loading}
            mode={showDeleted ? 'deleted' : 'active'}
            onRestore={showDeleted ? handleRestore : undefined}
            restoringId={restoringId}
          />

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
