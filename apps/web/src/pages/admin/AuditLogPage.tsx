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
  const { page, pageSize, totalPages, total, setPage, setTotal } = usePagination();

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
        console.error('Failed to fetch users:', err);
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
      console.error('Failed to fetch audit logs:', err);
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
      console.error('CSV export error:', err);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sistem Loglari' },
        ]}
        title="Sistem Loglari Paneli"
        subtitle="Tum sistem islemlerini takip edin ve denetleyin"
        action={
          <Badge variant="info" size="md">
            AUDIT TRAIL
          </Badge>
        }
      />

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
          title="Henuz log kaydi bulunmuyor"
          description="Sistem islemleri burada otomatik olarak kaydedilir."
        />
      ) : (
        <>
          <AuditLogTable data={logs} loading={loading} />

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
