"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, startOfQuarter, startOfYear } from "date-fns";
import {
  CalendarDays,
  Users,
  BarChart3,
  Globe,
  PieChart,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const reports: ReportCard[] = [
  {
    id: "periodic-quotation",
    title: "Dönemsel Teklif Raporu",
    description:
      "Zaman bazlı teklif hacimleri ve başarı oranlarını analiz edin.",
    icon: <CalendarDays className="w-7 h-7" />,
  },
  {
    id: "personnel-performance",
    title: "Personel Performans Raporu",
    description:
      "Satış temsilcisi metrikleri, dönüşüm oranları ve ekip performansını takip edin.",
    icon: <Users className="w-7 h-7" />,
  },
  {
    id: "won-lost-analysis",
    title: "Kazanılan/Kaybedilen Analizi",
    description:
      "Başarılı sevkiyatların kaybedilen fırsatlarla karşılaştırmalı detaylı analizi.",
    icon: <BarChart3 className="w-7 h-7" />,
  },
  {
    id: "country-mode-volume",
    title: "Ülke/Mod Hacim Raporu",
    description:
      "Varış ülkesi ve taşıma moduna göre sevkiyat hacimlerinin analizi.",
    icon: <Globe className="w-7 h-7" />,
  },
  {
    id: "loss-reason",
    title: "Kaybetme Nedeni Analizi",
    description:
      "Kaybedilen fırsatların nedenleri ve gelecekteki strateji geliştirme.",
    icon: <PieChart className="w-7 h-7" />,
  },
];

export default function ReportsPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [onlyHighValue, setOnlyHighValue] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleQuickSelect = (days: number) => {
    setFromDate(format(subDays(new Date(), days), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleQuarterSelect = () => {
    setFromDate(format(startOfQuarter(new Date()), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleYearSelect = () => {
    setFromDate(format(startOfYear(new Date()), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);

    const params = new URLSearchParams({
      type: reportId,
      startDate: fromDate,
      endDate: toDate,
    });

    if (onlyHighValue) {
      params.append("minValue", "10000");
    }

    router.push(`/reports/preview?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
        <div>
          <h3 className="font-bold text-lg mb-4">Tarih Aralığı</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Başlangıç
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Bitiş
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold mb-3">Hızlı Seçim</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(7)}
                  className="text-xs"
                >
                  Son 7 Gün
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(30)}
                  className="text-xs"
                >
                  Son 30 Gün
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuarterSelect}
                  className="text-xs"
                >
                  Bu Çeyrek
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleYearSelect}
                  className="text-xs"
                >
                  YTD
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold mb-3">Filtreler</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-drafts"
                    checked={includeDrafts}
                    onCheckedChange={(checked) =>
                      setIncludeDrafts(checked as boolean)
                    }
                  />
                  <Label htmlFor="include-drafts" className="text-sm">
                    Taslakları Dahil Et
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="high-value"
                    checked={onlyHighValue}
                    onCheckedChange={(checked) =>
                      setOnlyHighValue(checked as boolean)
                    }
                  />
                  <Label htmlFor="high-value" className="text-sm">
                    Sadece Yüksek Değer (10k+)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-[32px] font-bold leading-tight mb-2">Raporlar</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
              Nakliye operasyonlarınız için yönetici raporları seçin ve
              oluşturun. Veriler yan tarafta seçilen tarih aralığına göre
              üretilir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow ${
                  index === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="size-12 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight mb-1">
                      {report.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating === report.id}
                    className="flex items-center gap-2 h-9 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <span>Oluştur</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
