import { useState, useEffect } from 'react';
import { Icon, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import api from '@/config/api';
import type { AuditLog, PaginatedResponse } from '@nakliye-crm/shared';

interface CustomerHistoryTabProps {
  customerId: number;
}

const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  CREATE: { icon: 'add_circle', color: 'text-emerald-500', label: 'Olusturuldu' },
  UPDATE: { icon: 'edit', color: 'text-blue-500', label: 'Guncellendi' },
  DELETE: { icon: 'delete', color: 'text-red-500', label: 'Silindi' },
  RESTORE: { icon: 'restore', color: 'text-emerald-500', label: 'Geri alindi' },
  STATUS_CHANGE: { icon: 'swap_horiz', color: 'text-amber-500', label: 'Durum degisti' },
  ASSIGN: { icon: 'person_add', color: 'text-purple-500', label: 'Temsilci atandi' },
  TRANSFER: { icon: 'swap_horiz', color: 'text-purple-500', label: 'Devredildi' },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderChangeValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

export function CustomerHistoryTab({ customerId }: CustomerHistoryTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit', {
          params: { recordType: 'Customer', recordId: customerId, pageSize: 50 },
        });
        setLogs(data.data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [customerId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <EmptyState
          icon="history"
          title="Gecmis kaydi yok"
          description="Bu musteriye ait degisiklik gecmisi bulunamadi."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
        Degisiklik Gecmisi
        <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
          ({logs.length})
        </span>
      </h3>

      <div className="space-y-4">
        {logs.map((log) => {
          const config = ACTION_CONFIG[log.action] || {
            icon: 'info',
            color: 'text-slate-500 dark:text-slate-400',
            label: log.action,
          };

          return (
            <div
              key={log.id}
              className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Icon name={config.icon} className={cn('mt-0.5', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {config.label}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {log.user?.fullName || 'Sistem'}
                  </p>

                  {/* Show changed fields */}
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {Object.entries(log.changes).map(([field, change]) => (
                        <div
                          key={field}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="text-slate-500 dark:text-slate-400 font-medium min-w-[100px]">
                            {field}:
                          </span>
                          <span className="text-red-500 line-through">
                            {renderChangeValue(change.old)}
                          </span>
                          <Icon name="arrow_forward" size="sm" className="text-slate-400 dark:text-slate-500" />
                          <span className="text-emerald-600 font-medium">
                            {renderChangeValue(change.new)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
