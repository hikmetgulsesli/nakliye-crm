import { useState, useEffect } from 'react';
import { Button, Select, DatePicker } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { userService } from '@/services/user.service';
import { reportService, type ReportFilters, type ReportType, type ReportSummary } from '@/services/report.service';

const REPORT_TYPE_OPTIONS: { value: ReportType | ''; label: string }[] = [
  { value: '', label: 'Rapor Turu Seçin' },
  { value: 'periodic-quotes', label: 'Dönemsel Teklif Raporu' },
  { value: 'staff-performance', label: 'Personel Performans Raporu' },
  { value: 'win-loss', label: 'Kazanılan / Kaybedilen Analizi' },
  { value: 'country-mode-volume', label: 'Ülke / Mod Bazli Hacim' },
  { value: 'loss-reasons', label: 'Kaybedilme Nedeni Analizi' },
];

const TRANSPORT_MODE_OPTIONS = [
  { value: '', label: 'Tüm Modlar' },
  { value: 'sea', label: 'Deniz' },
  { value: 'air', label: 'Hava' },
  { value: 'land', label: 'Kara' },
  { value: 'rail', label: 'Demiryolu' },
  { value: 'multimodal', label: 'Multimodal' },
];

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err) {
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

  const userOptions = [
    { value: '', label: 'Tüm Temsilciler' },
    ...users,
  ];

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      setError('Lütfen bir rapor turu seçin.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setGenerating(true);
    setError(null);
    setReportGenerated(false);
    setReportData(null);

    try {
      const data = await reportService.getReport(selectedReportType, filters);
      setReportData(data);
      setReportGenerated(true);
      setTimeout(() => setReportGenerated(false), 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(`Rapor oluşturulurken bir hata oluştu: ${message}`);
      setTimeout(() => setError(null), 4000);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Raporlar' },
        ]}
        title="Yönetici Raporlari"
        subtitle="Detayli raporlar olusturun ve indirin"
      />

      {/* Alert messages */}
      {reportGenerated && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Rapor basariyla oluşturuldu.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* RAPOR TURU */}
          <Select
            label="Rapor Turu"
            icon="assessment"
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value as ReportType | '')}
            options={REPORT_TYPE_OPTIONS}
          />

          {/* TARIH ARALIGI */}
          <DatePicker
            label="Başlangıç Tarihi"
            value={filters.startDate ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value || undefined })
            }
          />
          <DatePicker
            label="Bitiş Tarihi"
            value={filters.endDate ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value || undefined })
            }
          />

          {/* SATIS TEMSILCISI */}
          <Select
            label="Satış Temsilcisi"
            icon="person"
            value={filters.assignedUserId?.toString() ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                assignedUserId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            options={userOptions}
          />

          {/* TASIMA MODU */}
          <Select
            label="Taşıma Modu"
            icon="local_shipping"
            value={filters.transportMode ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                transportMode: e.target.value || undefined,
              })
            }
            options={TRANSPORT_MODE_OPTIONS}
          />

          {/* Rapor Oluştur Button */}
          <div>
            <Button
              icon="assessment"
              className="w-full"
              onClick={handleGenerateReport}
              disabled={generating || !selectedReportType}
            >
              {generating ? 'Olusturuluyor...' : 'Rapor Oluştur'}
            </Button>
          </div>
        </div>
      </div>

      {/* Report preview / summary */}
      {reportData && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{reportData.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Oluşturulma: {new Date(reportData.generatedAt).toLocaleString('tr-TR')}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Hazir
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 overflow-auto max-h-80">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {JSON.stringify(reportData.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Report cards */}
      <ReportsPanel filters={filters} />
    </div>
  );
}
