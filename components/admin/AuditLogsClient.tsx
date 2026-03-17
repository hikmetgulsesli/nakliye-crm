"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  FileText,
  Building,
  Activity,
  Settings,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionLabels: Record<string, string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
  TRANSFER: "Devir",
  LOGIN: "Giriş",
  LOGOUT: "Çıkış",
};

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="w-4 h-4" />,
  UPDATE: <Edit className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
  TRANSFER: <RefreshCw className="w-4 h-4" />,
  LOGIN: <LogIn className="w-4 h-4" />,
  LOGOUT: <LogOut className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  TRANSFER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  LOGIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const entityTypeLabels: Record<string, string> = {
  customer: "Müşteri",
  quotation: "Teklif",
  activity: "Aktivite",
  user: "Kullanıcı",
  lookup_value: "Liste Değeri",
};

const entityTypeIcons: Record<string, React.ReactNode> = {
  customer: <Building className="w-4 h-4" />,
  quotation: <FileText className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  user: <User className="w-4 h-4" />,
  lookup_value: <Settings className="w-4 h-4" />,
};

export function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", meta.page.toString());
      params.set("limit", meta.limit.toString());
      if (search) params.set("search", search);
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) {
        // Send end of day timestamp to include the entire end day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        params.set("endDate", endOfDay.toISOString());
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Kayıtlar alınırken bir hata oluştu");
      }

      setLogs(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, action, entityType, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setMeta((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleExport = () => {
    // Convert logs to CSV
    const headers = ["Tarih", "Kullanıcı", "İşlem", "Kayıt Tipi", "Kayıt ID", "Değişiklikler"];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("tr-TR"),
      log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistem",
      actionLabels[log.action] || log.action,
      entityTypeLabels[log.entityType] || log.entityType,
      log.entityId || "-",
      log.action === "UPDATE" && log.oldValues
        ? Object.entries(log.oldValues as Record<string, { old: unknown; new: unknown }>)
            .map(([key, value]) => `${key}: ${value.old} → ${value.new}`)
            .join("; ")
        : "-",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `denetim-kayitlari-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const formatChanges = (log: AuditLog): string => {
    if (log.action === "UPDATE" && log.oldValues) {
      const changes = log.oldValues as Record<string, { old: unknown; new: unknown }>;
      return Object.entries(changes)
        .map(([key, value]) => {
          const fieldName = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          return `${fieldName}: ${value.old} → ${value.new}`;
        })
        .join(", ");
    }
    if (log.action === "CREATE" && log.newValues) {
      return "Yeni kayıt oluşturuldu";
    }
    if (log.action === "DELETE") {
      return "Kayıt silindi";
    }
    return "-";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Kullanıcı, işlem veya kayıt ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Action Filter */}
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Tüm İşlemler</option>
            <option value="CREATE">Oluşturma</option>
            <option value="UPDATE">Güncelleme</option>
            <option value="DELETE">Silme</option>
            <option value="TRANSFER">Devir</option>
            <option value="LOGIN">Giriş</option>
            <option value="LOGOUT">Çıkış</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Tüm Kayıt Tipleri</option>
            <option value="customer">Müşteri</option>
            <option value="quotation">Teklif</option>
            <option value="activity">Aktivite</option>
            <option value="user">Kullanıcı</option>
            <option value="lookup_value">Liste Değeri</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Başlangıç"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Bitiş"
          />

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Filtreleri Temizle
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="ml-auto px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-2 px-4 py-2 text-sm text-primary hover:underline"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500 dark:text-slate-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Denetim kaydı bulunamadı</p>
              <p className="text-sm mt-1">Filtreleri değiştirmeyi deneyin</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  İşlem
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Kayıt
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Değişiklikler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {log.user.firstName[0]}{log.user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{log.user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Sistem</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        actionColors[log.action]
                      }`}
                    >
                      {actionIcons[log.action]}
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{entityTypeIcons[log.entityType]}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </span>
                      {log.entityId && (
                        <span className="text-xs text-slate-400 font-mono">
                          {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {formatChanges(log)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 0 && (
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Toplam {meta.total} kayıttan {(meta.page - 1) * meta.limit + 1} -{" "}
            {Math.min(meta.page * meta.limit, meta.total)} arası gösteriliyor
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page === 1}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    meta.page === pageNum
                      ? "bg-primary text-white"
                      : "border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {meta.totalPages > 5 && (
              <>
                <span className="text-slate-400">...</span>
                <button
                  onClick={() => handlePageChange(meta.totalPages)}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {meta.totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page === meta.totalPages}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
