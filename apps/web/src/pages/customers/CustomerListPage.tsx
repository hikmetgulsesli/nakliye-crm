import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { SavedViewsTabs, type SavedView } from '@/components/shared/SavedViewsTabs';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { customerService, type CustomerFilters as CustomerFiltersType } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { useOnlyMinePref } from '@/hooks/useOnlyMinePref';
import type { Customer } from '@nakliye-crm/shared';

const EMPTY_FILTERS: CustomerFiltersType = {};

type ViewId = 'all' | 'high' | 'mine' | 'deleted';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { isUser, currentUserId, onlyMine, setOnlyMine } = useOnlyMinePref('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CustomerFiltersType>(EMPTY_FILTERS);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewId>(isUser && onlyMine ? 'mine' : 'all');
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
            .map((u) => ({ value: u.id.toString(), label: u.fullName })),
        );
      } catch (err) {
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

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

      const result = await customerService.getAll(page, pageSize, filtersToApply);
      setCustomers(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Müşteriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, debouncedSearch, activeView, onlyMine, currentUserId, setTotal]);

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
    setPage(1);
  }

  const views = useMemo<SavedView[]>(() => {
    const list: SavedView[] = [
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
          <CustomerTable
            data={customers}
            loading={loading}
            mode={showDeleted ? 'deleted' : 'active'}
            onRestore={showDeleted ? handleRestore : undefined}
            restoringId={restoringId}
            onInlineUpdate={!showDeleted ? handleInlineUpdate : undefined}
          />
        )}
      </div>

      {customers.length > 0 && (
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
