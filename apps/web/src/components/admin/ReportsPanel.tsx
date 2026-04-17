import { useState } from 'react';
import { Icon } from '@/components/ui';
import { reportService, type ReportType, type ExportFormat, type ReportFilters } from '@/services/report.service';

interface ReportCard {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    type: 'periodic-quotes',
    title: 'Dönemsel Teklif Raporu',
    description: 'Belirli tarih araliginda olusturulan, kazanılan ve kaybedilen tekliflerin özet raporu',
    icon: 'description',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
  },
  {
    type: 'staff-performance',
    title: 'Personel Performans Raporu',
    description: 'Satış temsilcilerinin müşteri, teklif ve aktivite bazli performans karsilastirmasi',
    icon: 'leaderboard',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    type: 'win-loss',
    title: 'Kazanılan / Kaybedilen Analizi',
    description: 'Tekliflerin kazanilma ve kaybedilme oranlari ile trend analizi',
    icon: 'analytics',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    type: 'country-mode-volume',
    title: 'Ülke / Mod Bazli Hacim',
    description: 'Ülke ve taşıma modu bazinda teklif hacimleri ve dagilim raporu',
    icon: 'public',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    type: 'loss-reasons',
    title: 'Kaybedilme Nedeni Analizi',
    description: 'Kaybedilen tekliflerin neden bazli dagilim ve trend raporu',
    icon: 'pie_chart',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
];

interface ReportsPanelProps {
  filters: ReportFilters;
}

export function ReportsPanel({ filters }: ReportsPanelProps) {
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleExport(type: ReportType, format: ExportFormat) {
    const key = `${type}_${format}`;
    setLoadingButtons((prev) => ({ ...prev, [key]: true }));
    setError(null);

    try {
      await reportService.exportReport(type, format, filters);
    } catch (err) {
      console.error('Report export error:', err);
      const message =
        err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(`Rapor indirilemedi: ${message}`);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {REPORT_CARDS.map((report) => (
        <div
          key={report.type}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex items-center gap-5 hover:border-slate-300 transition-colors"
        >
          {/* Icon */}
          <div
            className={`flex-shrink-0 size-12 rounded-xl ${report.iconBg} ${report.iconColor} flex items-center justify-center`}
          >
            <Icon name={report.icon} size="md" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{report.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {report.description}
            </p>
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleExport(report.type, 'pdf')}
              disabled={!!loadingButtons[`${report.type}_pdf`]}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loadingButtons[`${report.type}_pdf`] ? (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Icon name="picture_as_pdf" size="sm" />
              )}
              PDF
            </button>
            <button
              onClick={() => handleExport(report.type, 'excel')}
              disabled={!!loadingButtons[`${report.type}_excel`]}
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {loadingButtons[`${report.type}_excel`] ? (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Icon name="table_view" size="sm" />
              )}
              Excel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
