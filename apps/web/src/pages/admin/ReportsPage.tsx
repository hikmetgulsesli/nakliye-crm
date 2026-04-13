import { useState, useEffect } from 'react';
import { Button, Select, DatePicker } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { userService } from '@/services/user.service';
import type { ReportFilters } from '@/services/report.service';

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

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
            <Button icon="assessment" className="w-full">
              Rapor Olustur
            </Button>
          </div>
        </div>
      </div>

      {/* Report cards */}
      <ReportsPanel filters={filters} />
    </div>
  );
}
