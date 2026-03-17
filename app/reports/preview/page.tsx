"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  FileText,
  Table2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trophy,
  Plane,
  Ship,
  Truck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportType =
  | "periodic-quotation"
  | "personnel-performance"
  | "won-lost-analysis"
  | "country-mode-volume"
  | "loss-reason";

interface ReportData {
  reportType: ReportType;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: Record<string, unknown>;
  quotations?: Array<Record<string, unknown>>;
  personnel?: Array<Record<string, unknown>>;
  byOriginCountry?: Array<Record<string, unknown>>;
  byDestinationCountry?: Array<Record<string, unknown>>;
  lossReasons?: Array<Record<string, unknown>>;
}

const reportTitles: Record<ReportType, string> = {
  "periodic-quotation": "Dönemsel Teklif Raporu",
  "personnel-performance": "Personel Performans Raporu",
  "won-lost-analysis": "Kazanılan/Kaybedilen Analizi",
  "country-mode-volume": "Ülke/Mod Hacim Raporu",
  "loss-reason": "Kaybetme Nedeni Analizi",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  ACCEPTED: "Kazanıldı",
  REJECTED: "Kaybedildi",
  EXPIRED: "Süresi Doldu",
  CANCELLED: "İptal",
};

const transportModeIcons: Record<string, React.ReactNode> = {
  AIR: <Plane className="w-4 h-4" />,
  SEA: <Ship className="w-4 h-4" />,
  ROAD: <Truck className="w-4 h-4" />,
  RAIL: <TrendingUp className="w-4 h-4" />,
  MULTIMODAL: <ArrowRight className="w-4 h-4" />,
};

const transportModeLabels: Record<string, string> = {
  AIR: "Hava",
  SEA: "Deniz",
  ROAD: "Kara",
  RAIL: "Demiryolu",
  MULTIMODAL: "Multimodal",
};

function ReportPreviewContent() {
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type") as ReportType;
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const status = searchParams.get("status") || "all";
  const transportMode = searchParams.get("transportMode") || "all";
  const currency = searchParams.get("currency") || "all";

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!reportType || !startDate || !endDate) {
      setError("Eksik parametreler");
      setLoading(false);
      return;
    }

    fetchReportData();
  }, [reportType, startDate, endDate, status, transportMode, currency]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate,
      });

      if (status && status !== "all") params.append("status", status);
      if (transportMode && transportMode !== "all")
        params.append("transportMode", transportMode);
      if (currency && currency !== "all") params.append("currency", currency);

      const response = await fetch(`/api/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Rapor verisi alınamadı");
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel") => {
    if (!data) return;

    try {
      setExporting(format);
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          reportType,
          data,
          filename: `${reportType}-${startDate}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Export başarısız");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-${startDate}.${format === "pdf" ? "html" : "xls"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export sırasında bir hata oluştu");
    } finally {
      setExporting(null);
    }
  };

  const getPaginatedData = () => {
    if (!data) return [];

    let items: Array<Record<string, unknown>> = [];
    switch (reportType) {
      case "periodic-quotation":
      case "won-lost-analysis":
        items = data.quotations || [];
        break;
      case "personnel-performance":
        items = data.personnel || [];
        break;
      case "country-mode-volume":
        items = data.byOriginCountry || [];
        break;
      case "loss-reason":
        items = data.lossReasons || [];
        break;
    }

    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const getTotalPages = () => {
    if (!data) return 0;
    let total = 0;
    switch (reportType) {
      case "periodic-quotation":
      case "won-lost-analysis":
        total = data.quotations?.length || 0;
        break;
      case "personnel-performance":
        total = data.personnel?.length || 0;
        break;
      case "country-mode-volume":
        total = data.byOriginCountry?.length || 0;
        break;
      case "loss-reason":
        total = data.lossReasons?.length || 0;
        break;
    }
    return Math.ceil(total / itemsPerPage);
  };

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACCEPTED:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      REJECTED:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      CANCELLED:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    return (
      <Badge className={`${styles[status] || styles.DRAFT} font-medium`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const renderTableHeaders = () => {
    switch (reportType) {
      case "periodic-quotation":
      case "won-lost-analysis":
        return (
          <>
            <TableHead>Teklif No</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Mod</TableHead>
            <TableHead>Başlangıç</TableHead>
            <TableHead>Varış</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead>Durum</TableHead>
          </>
        );
      case "personnel-performance":
        return (
          <>
            <TableHead>Personel</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Teklif</TableHead>
            <TableHead>Kazanılan</TableHead>
            <TableHead>Kaybedilen</TableHead>
            <TableHead>Oran</TableHead>
            <TableHead>Toplam Değer</TableHead>
          </>
        );
      case "country-mode-volume":
        return (
          <>
            <TableHead>Ülke</TableHead>
            <TableHead>Teklif Sayısı</TableHead>
            <TableHead>Toplam Değer</TableHead>
          </>
        );
      case "loss-reason":
        return (
          <>
            <TableHead>Neden</TableHead>
            <TableHead>Sayı</TableHead>
            <TableHead>Değer</TableHead>
            <TableHead>Oran</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    const items = getPaginatedData();

    switch (reportType) {
      case "periodic-quotation":
      case "won-lost-analysis":
        return items.map((item, idx) => (
          <TableRow
            key={idx}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <TableCell className="font-medium">
              {item.quoteNumber as string}
            </TableCell>
            <TableCell>{item.customerName as string}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {transportModeIcons[item.transportMode as string] || (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {transportModeLabels[item.transportMode as string] ||
                    (item.transportMode as string)}
                </span>
              </div>
            </TableCell>
            <TableCell>{item.origin as string}</TableCell>
            <TableCell>{item.destination as string}</TableCell>
            <TableCell className="text-right">
              {Number(item.totalCost).toLocaleString("tr-TR")}{" "}
              <span className="text-xs text-slate-500">{item.currency as string}</span>
            </TableCell>
            <TableCell>{renderStatusBadge(item.status as string)}</TableCell>
          </TableRow>
        ));
      case "personnel-performance":
        return items.map((item, idx) => (
          <TableRow
            key={idx}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <TableCell className="font-medium">{item.name as string}</TableCell>
            <TableCell>{item.role as string}</TableCell>
            <TableCell>{item.totalQuotes as number}</TableCell>
            <TableCell>{item.wonQuotes as number}</TableCell>
            <TableCell>{item.lostQuotes as number}</TableCell>
            <TableCell>%{item.winRate as string}</TableCell>
            <TableCell>
              {Number(item.totalValue).toLocaleString("tr-TR")}
            </TableCell>
          </TableRow>
        ));
      case "country-mode-volume":
        return items.map((item, idx) => (
          <TableRow
            key={idx}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <TableCell className="font-medium">
              {item.country as string}
            </TableCell>
            <TableCell>{item.count as number}</TableCell>
            <TableCell>{Number(item.value).toLocaleString("tr-TR")}</TableCell>
          </TableRow>
        ));
      case "loss-reason":
        return items.map((item, idx) => (
          <TableRow
            key={idx}
            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <TableCell className="font-medium">{item.label as string}</TableCell>
            <TableCell>{item.count as number}</TableCell>
            <TableCell>{Number(item.value).toLocaleString("tr-TR")}</TableCell>
            <TableCell>%{item.percentage as string}</TableCell>
          </TableRow>
        ));
      default:
        return null;
    }
  };

  const renderSummary = () => {
    if (!data) return null;

    switch (reportType) {
      case "periodic-quotation": {
        const summary = data.summary;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                İşlenen Toplam Teklif
              </p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {summary.totalQuotes as number}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  %{summary.winRate as string} başarı
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                Para Birimine Göre Toplam Değer
              </p>
              <div className="flex flex-col gap-3">
                {Object.entries(summary.currencyTotals as Record<string, number>)
                  .slice(0, 3)
                  .map(([curr, value]) => (
                    <div
                      key={curr}
                      className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {curr}
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {value.toLocaleString("tr-TR")}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Genel Kazanma Oranı
                </p>
                <Trophy className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                %{summary.winRate as string}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  className="bg-[var(--color-primary)] h-2.5 rounded-full"
                  style={{ width: `${Math.min(Number(summary.winRate), 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                Hedef: 65%
              </p>
            </div>
          </div>
        );
      }
      case "personnel-performance": {
        const summary = data.summary;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Toplam Teklif
              </p>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {summary.totalQuotes as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Kazanılan Teklif
              </p>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {summary.wonQuotes as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Genel Kazanma Oranı
              </p>
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                %{summary.overallWinRate as string}
              </div>
            </div>
          </div>
        );
      }
      case "won-lost-analysis": {
        const summary = data.summary;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Toplam Karar
              </p>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {summary.totalDecided as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Kazanılan / Kaybedilen
              </p>
              <div className="text-2xl font-bold">
                <span className="text-green-600 dark:text-green-400">
                  {summary.wonCount as number}
                </span>
                <span className="text-slate-400 mx-2">/</span>
                <span className="text-red-600 dark:text-red-400">
                  {summary.lostCount as number}
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Kazanma Oranı
              </p>
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                %{summary.winRate as string}
              </div>
            </div>
          </div>
        );
      }
      case "country-mode-volume": {
        const summary = data.summary;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Toplam Teklif
              </p>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {summary.totalQuotations as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Benzersiz Çıkış Ülkesi
              </p>
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                {summary.uniqueOrigins as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Benzersiz Varış Ülkesi
              </p>
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                {summary.uniqueDestinations as number}
              </div>
            </div>
          </div>
        );
      }
      case "loss-reason": {
        const summary = data.summary;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Toplam Kayıp
              </p>
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                {summary.totalLostQuotes as number}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Toplam Kayıp Değer
              </p>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {Number(summary.totalLostValue).toLocaleString("tr-TR")}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Ortalama Kayıp Değer
              </p>
              <div className="text-4xl font-bold text-[var(--color-primary)]">
                {Number(summary.averageLostValue).toLocaleString("tr-TR")}
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Rapor verisi bulunamadı
          </p>
          <Button onClick={() => window.history.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  const totalPages = getTotalPages();

  return (
    <div className="flex-1 flex flex-col items-center py-8 px-4 sm:px-8 lg:px-12 w-full max-w-[1400px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
            {reportTitles[reportType]} Önizleme
          </h1>
          <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
            Aktif Tarih Aralığı: {format(parseISO(startDate), "d MMM yyyy", { locale: tr })} -{" "}
            {format(parseISO(endDate), "d MMM yyyy", { locale: tr })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {exporting === "pdf" ? "İşleniyor..." : "PDF İndir"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            className="flex items-center gap-2"
          >
            <Table2 className="w-4 h-4" />
            {exporting === "excel" ? "İşleniyor..." : "Excel İndir"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="w-full flex gap-3 mb-6 flex-wrap">
        <Select value={status} onValueChange={() => {}}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Durum: Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="ACCEPTED">Kazanıldı</SelectItem>
            <SelectItem value="REJECTED">Kaybedildi</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="SENT">Gönderildi</SelectItem>
          </SelectContent>
        </Select>

        <Select value={transportMode} onValueChange={() => {}}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Taşıma Modu: Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="AIR">Hava</SelectItem>
            <SelectItem value="SEA">Deniz</SelectItem>
            <SelectItem value="ROAD">Kara</SelectItem>
            <SelectItem value="RAIL">Demiryolu</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currency} onValueChange={() => {}}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Para Birimi: Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="TRY">TRY</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col mb-8">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                {renderTableHeaders()}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-200 dark:divide-slate-800">
              {renderTableRows()}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, data.quotations?.length || 0)}{" "}
              arası gösteriliyor
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page ? "bg-[var(--color-primary)]" : ""
                    }
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="w-full">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Rapor Özeti
        </h3>
        {renderSummary()}
      </div>
    </div>
  );
}

export default function ReportPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <ReportPreviewContent />
    </Suspense>
  );
}
