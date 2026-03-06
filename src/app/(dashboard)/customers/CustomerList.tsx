"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge, PotentialBadge } from "@/components/ui/badges";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";

interface Customer {
  id: number;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  status: "Aktif" | "Pasif" | "Soguk";
  potential: "Dusuk" | "Orta" | "Yuksek" | null;
  assigned_user_name: string | null;
  source: string | null;
  transport_modes: string[] | null;
  created_at: string;
}

interface CustomersResponse {
  data: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusOptions = [
  { value: "", label: "Tümü" },
  { value: "Aktif", label: "Aktif" },
  { value: "Pasif", label: "Pasif" },
  { value: "Soguk", label: "Soğuk" },
];

const potentialOptions = [
  { value: "", label: "Tümü" },
  { value: "Yuksek", label: "Yüksek" },
  { value: "Orta", label: "Orta" },
  { value: "Dusuk", label: "Düşük" },
];

const sourceOptions = [
  { value: "", label: "Tümü" },
  { value: "Referans", label: "Referans" },
  { value: "Soguk arama", label: "Soğuk Arama" },
  { value: "Fuar", label: "Fuar" },
  { value: "Dijital", label: "Dijital" },
];

const transportModeOptions = [
  { value: "", label: "Tümü" },
  { value: "Deniz", label: "Deniz" },
  { value: "Hava", label: "Hava" },
  { value: "Kara", label: "Kara" },
  { value: "Kombine", label: "Kombine" },
];

export default function CustomerListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  // Filter state
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [potential, setPotential] = React.useState("");
  const [source, setSource] = React.useState("");
  const [transportMode, setTransportMode] = React.useState("");

  // Sorting state
  const [sortColumn, setSortColumn] = React.useState<string>("created_at");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Check if user is admin
  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.data?.role === "admin");
        }
      } catch {
        // Silently fail - user might not be logged in
      }
    };
    checkAdmin();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load initial state from URL params
  React.useEffect(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const searchParam = searchParams.get("search");
    const statusParam = searchParams.get("status");
    const potentialParam = searchParams.get("potential");
    const sourceParam = searchParams.get("source");
    const transportModeParam = searchParams.get("transport_mode");

    if (pageParam) setPage(parseInt(pageParam, 10));
    if (limitParam) setPageSize(parseInt(limitParam, 10));
    if (searchParam) setSearch(searchParam);
    if (statusParam) setStatus(statusParam);
    if (potentialParam) setPotential(potentialParam);
    if (sourceParam) setSource(sourceParam);
    if (transportModeParam) setTransportMode(transportModeParam);
  }, [searchParams]);

  // Update URL when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (pageSize !== 20) params.set("limit", pageSize.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (potential) params.set("potential", potential);
    if (source) params.set("source", source);
    if (transportMode) params.set("transport_mode", transportMode);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState({}, "", newUrl);
  }, [page, pageSize, debouncedSearch, status, potential, source, transportMode]);

  // Fetch customers
  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status) params.set("status", status);
      if (potential) params.set("potential", potential);
      if (source) params.set("source", source);
      if (transportMode) params.set("transport_mode", transportMode);

      const response = await fetch(`/api/customers?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Müşteriler yüklenirken bir hata oluştu");
      }

      const result: CustomersResponse = await response.json();
      setCustomers(result.data);
      setTotalPages(result.meta.totalPages);
      setTotalItems(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, potential, source, transportMode]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPotential("");
    setSource("");
    setTransportMode("");
    setPage(1);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Firma Adı",
      "Yetkili",
      "Telefon",
      "E-posta",
      "Durum",
      "Potansiyel",
      "Kaynak",
      "Temsilci",
      "Taşıma Modları",
    ];

    const rows = customers.map((c) => [
      c.id,
      c.company_name,
      c.contact_name || "",
      c.phone || "",
      c.email || "",
      c.status,
      c.potential || "",
      c.source || "",
      c.assigned_user_name || "",
      c.transport_modes?.join(", ") || "",
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `musteriler-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Silme işlemi başarısız oldu");
      }

      fetchCustomers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: "company_name",
      header: "Firma Adı",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{row.company_name}</div>
          {row.contact_name && (
            <div className="text-sm text-muted-foreground">{row.contact_name}</div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Durum",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "potential",
      header: "Potansiyel",
      sortable: true,
      render: (row) => <PotentialBadge potential={row.potential} />,
    },
    {
      key: "assigned_user_name",
      header: "Temsilci",
      sortable: true,
      render: (row) => row.assigned_user_name || "-",
    },
    {
      key: "source",
      header: "Kaynak",
      sortable: true,
      render: (row) => row.source || "-",
    },
    {
      key: "transport_modes",
      header: "Taşıma Modu",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.transport_modes?.slice(0, 2).map((mode) => (
            <span
              key={mode}
              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
            >
              {mode}
            </span>
          ))}
          {row.transport_modes && row.transport_modes.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{row.transport_modes.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "İşlemler",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/customers/${row.id}`)}
            aria-label="Görüntüle"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/customers/${row.id}/edit`)}
            aria-label="Düzenle"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.id)}
              aria-label="Sil"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const hasActiveFilters =
    debouncedSearch || status || potential || source || transportMode;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Müşteriler</h1>
          <p className="text-muted-foreground">
            Müşteri kartlarını görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV İndir
            </Button>
          )}
          <Button onClick={() => router.push("/customers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Firma, yetkili, telefon veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtreler
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {[status, potential, source, transportMode].filter(Boolean).length +
                  (debouncedSearch ? 1 : 0)}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Potansiyel</label>
              <select
                value={potential}
                onChange={(e) => setPotential(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {potentialOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kaynak</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Taşıma Modu</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {transportModeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        <DataTable
          data={customers}
          columns={columns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage="Müşteri bulunamadı"
          keyExtractor={(row) => row.id}
        />

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="border-t px-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}
