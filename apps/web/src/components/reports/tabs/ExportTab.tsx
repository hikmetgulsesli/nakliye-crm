import { ReportsPanel } from '@/components/admin/ReportsPanel';
import type { AnalyticsFilters } from '@/services/analytics.service';
import type { ReportFilters } from '@/services/report.service';

interface ExportTabProps {
  filters: AnalyticsFilters;
}

/**
 * AnalyticsFilters yapisini eski ReportFilters formatina cevirir.
 * Cok-secimli temsilciden ilkini alir (export'lar tek temsilci destekliyor).
 */
function toReportFilters(f: AnalyticsFilters): ReportFilters {
  return {
    startDate: f.startDate,
    endDate: f.endDate,
    assignedUserId: f.assignedUserIds && f.assignedUserIds.length === 1 ? f.assignedUserIds[0] : undefined,
    transportMode: f.transportMode,
    currency: f.currency,
  };
}

export function ExportTab({ filters }: ExportTabProps) {
  const reportFilters = toReportFilters(filters);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
        <div className="font-semibold">Rapor İndirme</div>
        <p className="mt-1 text-xs leading-relaxed">
          Aşağıdaki raporları seçili dönem ve filtrelere göre PDF veya Excel olarak indirebilirsiniz.
          {filters.assignedUserIds && filters.assignedUserIds.length > 1 && (
            <span className="ml-1 font-medium">
              · Birden fazla temsilci seçtiniz; PDF/Excel raporlarında temsilci filtresi uygulanmayacak.
            </span>
          )}
        </p>
      </div>
      <ReportsPanel filters={reportFilters} />
    </div>
  );
}
