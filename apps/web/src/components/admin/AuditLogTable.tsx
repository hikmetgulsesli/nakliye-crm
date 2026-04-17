import { useState } from 'react';
import { Avatar, Badge, Icon } from '@/components/ui';
import { JsonDiffViewer } from '@/components/shared/JsonDiffViewer';
import type { AuditLog } from '@nakliye-crm/shared';

interface AuditLogTableProps {
  data: AuditLog[];
  loading?: boolean;
}

const ACTION_VARIANT_MAP: Record<string, { variant: 'info' | 'danger' | 'success' | 'warning' | 'neutral'; label: string }> = {
  CREATE: { variant: 'success', label: 'Olusturma' },
  UPDATE: { variant: 'info', label: 'Guncelleme' },
  DELETE: { variant: 'danger', label: 'Silme' },
  BULK_TRANSFER: { variant: 'warning', label: 'Toplu Devir' },
};

const RECORD_TYPE_MAP: Record<string, string> = {
  Customer: 'Musteri',
  Quotation: 'Teklif',
  User: 'Kullanici',
  LookupValue: 'Liste Degeri',
  Activity: 'Aktivite',
};

function formatChangeSummary(changes: Record<string, { old: unknown; new: unknown }> | null | undefined): string {
  if (!changes) return '-';
  const fields = Object.keys(changes);
  if (fields.length === 0) return '-';
  if (fields.length === 1) return `${fields[0]} alani guncellendi`;
  return `${fields.length} alan guncellendi (${fields.slice(0, 3).join(', ')}${fields.length > 3 ? '...' : ''})`;
}

export function AuditLogTable({ data, loading }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-slate-50 dark:bg-slate-800/60 h-12" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 rounded w-36" />
              <div className="size-8 rounded-full bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-6 bg-slate-200 rounded-full w-20" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="flex-1 h-4 bg-slate-200 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
        <Icon name="history" size="xl" className="text-slate-300 mb-3" />
        <p className="text-slate-400 dark:text-slate-500 text-sm">Log kaydi bulunamadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Tarih / Saat
                </th>
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Kullanici
                </th>
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Islem
                </th>
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Kayit Turu
                </th>
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Kayit
                </th>
                <th className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-6 py-4 text-left font-semibold">
                  Degisiklik Ozeti
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((log) => {
                const actionInfo = ACTION_VARIANT_MAP[log.action] ?? {
                  variant: 'neutral' as const,
                  label: log.action,
                };
                const isExpanded = expandedId === log.id;
                const hasChanges = log.changes && Object.keys(log.changes).length > 0;

                return (
                  <tr key={log.id}>
                    <td colSpan={6} className="p-0">
                      {/* Row */}
                      <div
                        onClick={() => hasChanges && setExpandedId(isExpanded ? null : log.id)}
                        className={`flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 transition-colors ${
                          hasChanges ? 'cursor-pointer' : ''
                        }`}
                      >
                        {/* TARIH/SAAT */}
                        <div className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 min-w-[180px]">
                          {new Date(log.createdAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}{' '}
                          <span className="text-slate-400 dark:text-slate-500">
                            {new Date(log.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* KULLANICI */}
                        <div className="px-6 py-4 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={log.user?.fullName}
                              size="sm"
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {log.user?.fullName ?? 'Bilinmeyen'}
                            </span>
                          </div>
                        </div>

                        {/* ISLEM */}
                        <div className="px-6 py-4 min-w-[140px]">
                          <Badge variant={actionInfo.variant} size="sm">
                            {actionInfo.label}
                          </Badge>
                        </div>

                        {/* KAYIT TURU */}
                        <div className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 min-w-[120px]">
                          {RECORD_TYPE_MAP[log.recordType] ?? log.recordType}
                        </div>

                        {/* KAYIT link */}
                        <div className="px-6 py-4 min-w-[80px]">
                          <span className="text-sm text-primary font-medium hover:underline">
                            #{log.recordId}
                          </span>
                        </div>

                        {/* DEGISIKLIK OZETI */}
                        <div className="px-6 py-4 flex-1 flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {formatChangeSummary(log.changes)}
                          </span>
                          {hasChanges && (
                            <Icon
                              name={isExpanded ? 'expand_less' : 'expand_more'}
                              size="sm"
                              className="text-slate-400 dark:text-slate-500 flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>

                      {/* Expanded diff viewer */}
                      {isExpanded && hasChanges && (
                        <div className="px-6 pb-4">
                          <JsonDiffViewer changes={log.changes} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
