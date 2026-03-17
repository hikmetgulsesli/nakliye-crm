'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, endOfDay } from 'date-fns';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: User | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50',
  TRANSFER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50',
  LOGIN: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  LOGOUT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
};

const entityIcons: Record<string, string> = {
  customer: 'corporate_fare',
  quotation: 'request_quote',
  activity: 'event_note',
  shipment: 'local_shipping',
  user: 'person',
  lookup_value: 'list',
};

// Escape CSV cell value according to RFC 4180
function escapeCSVValue(value: string): string {
  if (value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return '"' + value + '"';
}

export function AuditLogsClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Validate and clamp pagination params
  const getValidPage = (p: number): number => Math.max(1, isNaN(p) ? 1 : p);
  const getValidLimit = (l: number): number => Math.min(100, Math.max(1, isNaN(l) ? 10 : l));

  // Fetch logs - useCallback with stable dependencies
  const fetchLogs = useCallback(async (fetchPage: number, fetchLimit: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', getValidPage(fetchPage).toString());
      params.set('limit', getValidLimit(fetchLimit).toString());
      
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
      }
      // For dateTo, include time to make the filter inclusive (end of day)
      if (dateTo) {
        params.set('dateTo', endOfDay(new Date(dateTo)).toISOString());
      }
      // Add user search for server-side filtering
      if (userSearch.trim()) {
        params.set('userSearch', userSearch.trim());
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo, userSearch]);

  // Initial fetch and when pagination changes (but not userSearch to avoid excessive calls)
  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== 'ADMIN') {
        router.push('/unauthorized');
        return;
      }
      fetchLogs(pagination.page, pagination.limit);
    }
  }, [status, session, router, pagination.page, pagination.limit, fetchLogs]);

  // Separate effect for userSearch to avoid refetching on every keystroke
  useEffect(() => {
    if (status === 'authenticated' && loading === false) {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole === 'ADMIN') {
        // Reset to page 1 and fetch when userSearch changes
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs(1, pagination.limit);
      }
    }
  }, [userSearch]);

  // Clear filters
  const clearFilters = () => {
    setUserSearch('');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export to CSV with proper escaping
  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
    const rows = logs.map(log => {
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
      const changes = log.newValues 
        ? Object.keys(log.newValues).join(', ') 
        : 'N/A';
      return [
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        userName,
        log.user?.email || 'N/A',
        log.action,
        log.entityType,
        log.entityId || 'N/A',
        changes,
      ];
    });

    const csvContent = [
      headers.map(h => escapeCSVValue(h)).join(','),
      ...rows.map(row => row.map(cell => escapeCSVValue(cell)).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke object URL to prevent memory leak
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  };

  // Toggle row expansion using functional update to avoid stale closure
  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  // Get field changes for display
  const getFieldChanges = (log: AuditLog) => {
    if (!log.oldValues && !log.newValues) return null;
    
    const oldFields = log.oldValues || {};
    const newFields = log.newValues || {};
    const allFieldKeys = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);
    
    return Array.from(allFieldKeys).map(key => ({
      field: key,
      oldValue: oldFields[key] !== undefined ? String(oldFields[key]) : null,
      newValue: newFields[key] !== undefined ? String(newFields[key]) : null,
    }));
  };

  // Check if log has diff to display - explicit boolean return
  const hasDiff = (log: AuditLog): boolean => {
    return !!log.oldValues || !!log.newValues;
  };

  // Render pagination buttons with sliding window around current page
  const renderPaginationButtons = () => {
    const buttons: React.ReactNode[] = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    
    if (totalPages <= 7) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => setPagination(prev => ({ ...prev, page: i }))}
            className={`flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
              i === currentPage
                ? 'bg-primary text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
            }`}
            style={i === currentPage ? { backgroundColor: 'var(--color-primary, #1258e2)' } : {}}
          >
            {i}
          </button>
        );
      }
    } else {
      // Sliding window around current page
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      // Adjust window if at edges
      if (currentPage <= 3) {
        start = 1;
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages;
      }
      
      // First page
      if (start > 1) {
        buttons.push(
          <button
            key={1}
            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
            className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium transition-colors"
          >
            1
          </button>
        );
        if (start > 2) {
          buttons.push(<span key="ellipsis1" className="flex size-8 items-center justify-center text-slate-400">...</span>);
        }
      }
      
      // Window pages
      for (let i = start; i <= end; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => setPagination(prev => ({ ...prev, page: i }))}
            className={`flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
              i === currentPage
                ? 'bg-primary text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
            }`}
            style={i === currentPage ? { backgroundColor: 'var(--color-primary, #1258e2)' } : {}}
          >
            {i}
          </button>
        );
      }
      
      // Last page
      if (end < totalPages) {
        if (end < totalPages - 1) {
          buttons.push(<span key="ellipsis2" className="flex size-8 items-center justify-center text-slate-400">...</span>);
        }
        buttons.push(
          <button
            key={totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
            className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium transition-colors"
          >
            {totalPages}
          </button>
        );
      }
    }
    
    return buttons;
  };

  if (status === 'loading') {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <main className="flex-1 px-10 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-display">
          Audit Logs
        </h1>
        <button
          onClick={exportCSV}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-medium shadow-sm"
          style={{ backgroundColor: 'var(--color-primary, #1258e2)' }}
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* User Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              User
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px]">
                person_search
              </span>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                style={{ '--tw-ring-color': 'var(--color-primary, #1258e2)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Operation Type
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px]">
                filter_list
              </span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full h-10 pl-10 pr-10 appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                style={{ '--tw-ring-color': 'var(--color-primary, #1258e2)' } as React.CSSProperties}
              >
                <option value="all">All Operations</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="transfer">Transfer</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Date From
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px]">
                calendar_month
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                style={{ '--tw-ring-color': 'var(--color-primary, #1258e2)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Date To
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px]">
                calendar_month
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 transition-all cursor-pointer"
                style={{ '--tw-ring-color': 'var(--color-primary, #1258e2)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="h-10 px-4 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center justify-center font-medium text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[180px]">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[150px]">
                  Operation
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[200px]">
                  Record Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[150px]">
                  Record ID
                </th>
                <th className="px-6 py-4 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tbody key={log.id}>
                    <tr
                      onClick={() => hasDiff(log) && toggleRow(log.id)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors ${hasDiff(log) ? 'cursor-pointer group' : ''}`}
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd')}
                        </div>
                        <div className="text-xs mt-0.5">
                          {format(new Date(log.createdAt), 'hh:mm:ss a')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {log.user ? (
                              <>
                                {log.user.firstName[0]}{log.user.lastName[0]}
                              </>
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">computer</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {log.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${actionColors[log.action] || actionColors.UPDATE}`}>
                          {log.action.charAt(0) + log.action.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500">
                            {entityIcons[log.entityType] || 'description'}
                          </span>
                          <span className="capitalize">{log.entityType.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">
                        {log.entityId ? (
                          <span className="hover:text-primary transition-colors hover:underline cursor-pointer">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {hasDiff(log) && (
                          <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors text-[20px] ${expandedRow === log.id ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded Row - Field Changes */}
                    {expandedRow === log.id && hasDiff(log) && (
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b-0">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                              Field Changes
                            </h4>
                            <div className="flex flex-col gap-2">
                              {getFieldChanges(log)?.map((change) => (
                                <div key={change.field} className="flex items-center gap-4 text-sm">
                                  <span className="text-slate-500 dark:text-slate-400 w-[120px] font-medium capitalize">
                                    {change.field.replace(/_/g, ' ')}
                                  </span>
                                  {change.oldValue !== null ? (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 line-through decoration-red-500/50">
                                      {change.oldValue}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 italic">
                                      null
                                    </span>
                                  )}
                                  <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-500">
                                    arrow_right_alt
                                  </span>
                                  {change.newValue !== null ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium">
                                      {change.newValue}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 italic">
                                      null
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-slate-100">{logs.length}</span> of{' '}
              <span className="font-medium text-slate-900 dark:text-slate-100">{pagination.total}</span> results
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              
              {renderPaginationButtons()}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex size-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
