import { useState, useEffect, useCallback } from 'react';
import { Badge, Pagination } from '@/components/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { AuditLogFilters } from '@/components/admin/AuditLogFilters';
import { auditService, type AuditLogFilters as AuditLogFiltersType } from '@/services/audit.service';
import { userService } from '@/services/user.service';
import { usePagination } from '@/hooks/usePagination';
import type { AuditLog } from '@nakliye-crm/shared';

const EMPTY_FILTERS: AuditLogFiltersType = {};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFiltersType>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFiltersType>(EMPTY_FILTERS);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { page, pageSize, totalPages, total, setPage, setPageSize, setTotal } = usePagination();

  // Fetch users for filter dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data.map((u) => ({
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditService.getAll(page, pageSize, appliedFilters);
      setLogs(result.data);
      setTotal(result.total);
    } catch (err) {
      setError('Sistem logları yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters, setTotal]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleApply() {
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  async function handleExportCsv() {
    try {
      const blob = await auditService.exportCsv(appliedFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('CSV dosyasi indirilirken bir hata oluştu.');
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sistem Logları' },
        ]}
        title="Sistem Logları Paneli"
        subtitle="Tüm sistem islemlerini takip edin ve denetleyin"
        action={
          <Badge variant="info" size="md">
            AUDIT TRAIL
          </Badge>
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

      <AuditLogFilters
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onExportCsv={handleExportCsv}
        users={users}
      />

      {!loading && logs.length === 0 ? (
        <EmptyState
          icon="history"
          title="Henuz log kaydı bulunmuyor"
          description="Sistem işlemleri burada otomatik olarak kaydedilir."
        />
      ) : (
        <>
          {/* Üst pagination */}
          <div className="mb-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>

          <AuditLogTable data={logs} loading={loading} />

          {/* Alt pagination */}
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
        </>
      )}
    </div>
  );
}
