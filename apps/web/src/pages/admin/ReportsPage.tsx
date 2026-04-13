import { useState, useEffect } from 'react';
import { Button, Select, DatePicker } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { userService } from '@/services/user.service';
import { reportService, type ReportFilters, type ReportType } from '@/services/report.service';

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
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
        console.error('Failed to fetch users:', err);
      }
    }
    fetchUsers();
  }, []);

  const userOptions = [
    { value: '', label: 'Tum Temsilciler' },
    ...users,
  ];

  const regionOptions = [
    { value: '', label: 'Tum Bolgeler' },
    { value: 'europe', label: 'Avrupa' },
    { value: 'asia', label: 'Asya' },
    { value: 'america', label: 'Amerika' },
    { value: 'africa', label: 'Afrika' },
    { value: 'middle_east', label: 'Orta Dogu' },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    setReportGenerated(false);

    try {
      // Generate a periodic_quotes report as the default type
      const reportType: ReportType = 'periodic_quotes';
      await reportService.getReport(reportType, filters);
      setReportGenerated(true);

      // Auto-hide success after 4 seconds
      setTimeout(() => setReportGenerated(false), 4000);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Rapor olusturulurken bir hata olustu. Lutfen tekrar deneyin.');
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
        title="Yonetici Raporlari"
        subtitle="Detayli raporlar olusturun ve indirin"
      />

      {/* Alert messages */}
      {reportGenerated && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Rapor basariyla olusturuldu.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* TARIH ARALIGI */}
          <DatePicker
            label="Baslangic Tarihi"
            value={filters.startDate ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value || undefined })
            }
          />
          <DatePicker
            label="Bitis Tarihi"
            value={filters.endDate ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value || undefined })
            }
          />

          {/* SATIS TEMSILCISI */}
          <Select
            label="Satis Temsilcisi"
            icon="person"
            value={filters.userId?.toString() ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                userId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            options={userOptions}
          />

          {/* BOLGE / HAT */}
          <Select
            label="Bolge / Hat"
            icon="public"
            value={filters.region ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                region: e.target.value || undefined,
              })
            }
            options={regionOptions}
          />

          {/* Rapor Olustur Button */}
          <div>
            <Button
              icon="assessment"
              className="w-full"
              onClick={handleGenerateReport}
              disabled={generating}
            >
              {generating ? 'Olusturuluyor...' : 'Rapor Olustur'}
            </Button>
          </div>
        </div>
      </div>

      {/* Report cards */}
      <ReportsPanel filters={filters} />
    </div>
  );
}
