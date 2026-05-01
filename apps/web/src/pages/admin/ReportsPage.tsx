import { useEffect, useMemo, useState } from 'react';
import { Icon, Tabs } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { AnalyticsFilterBar } from '@/components/reports/AnalyticsFilterBar';
import { OverviewTab } from '@/components/reports/tabs/OverviewTab';
import { TeamTab } from '@/components/reports/tabs/TeamTab';
import { QuoteFunnelTab } from '@/components/reports/tabs/QuoteFunnelTab';
import { PipelineTab } from '@/components/reports/tabs/PipelineTab';
import { CustomersTab } from '@/components/reports/tabs/CustomersTab';
import { LogisticsTab } from '@/components/reports/tabs/LogisticsTab';
import { ShipmentsTab } from '@/components/reports/tabs/ShipmentsTab';
import { ActivityTab } from '@/components/reports/tabs/ActivityTab';
import { RevenueTab } from '@/components/reports/tabs/RevenueTab';
import { ExportTab } from '@/components/reports/tabs/ExportTab';
import { userService } from '@/services/user.service';
import type { AnalyticsFilters } from '@/services/analytics.service';

const TAB_DEFS = [
  { key: 'overview', label: 'Genel Bakış', icon: 'dashboard' },
  { key: 'team', label: 'Takım', icon: 'groups' },
  { key: 'funnel', label: 'Teklif Hunisi', icon: 'filter_alt' },
  { key: 'pipeline', label: 'Aktif Pipeline', icon: 'hourglass_top' },
  { key: 'customers', label: 'Müşteri Analizi', icon: 'business' },
  { key: 'logistics', label: 'Lojistik', icon: 'public' },
  { key: 'shipments', label: 'Sevkiyatlar', icon: 'local_shipping' },
  { key: 'activities', label: 'Aktiviteler', icon: 'history' },
  { key: 'revenue', label: 'Gelir', icon: 'payments' },
  { key: 'export', label: 'Dışa Aktar', icon: 'download' },
];

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultFilters(): AnalyticsFilters {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: isoDay(start), endDate: isoDay(now) };
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userService
      .getAll(1, 100)
      .then((result) => {
        if (cancelled) return;
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({ value: u.id.toString(), label: u.fullName })),
        );
      })
      .catch(() => {
        if (!cancelled) setUsersError('Temsilci listesi yüklenemedi.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = useMemo(
    () =>
      TAB_DEFS.map((t) => ({
        key: t.key,
        label: t.label,
      })),
    [],
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Yönetici Raporları' },
        ]}
        title="Yönetici Raporları"
        subtitle="Ekibin performansını, satış pipeline'ını ve operasyonel metrikleri tek ekranda takip edin"
      />

      {usersError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Icon name="warning" size="sm" className="mr-1 align-text-bottom" />
          {usersError}
        </div>
      )}

      {/* Filtre cubugu */}
      <AnalyticsFilterBar
        filters={filters}
        onChange={setFilters}
        users={users}
        className="mb-4"
      />

      {/* Tab bar */}
      <div className="mb-6 -mx-1 overflow-x-auto px-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab filters={filters} />}
        {activeTab === 'team' && <TeamTab filters={filters} />}
        {activeTab === 'funnel' && <QuoteFunnelTab filters={filters} />}
        {activeTab === 'pipeline' && <PipelineTab filters={filters} />}
        {activeTab === 'customers' && <CustomersTab filters={filters} />}
        {activeTab === 'logistics' && <LogisticsTab filters={filters} />}
        {activeTab === 'shipments' && <ShipmentsTab filters={filters} />}
        {activeTab === 'activities' && <ActivityTab filters={filters} />}
        {activeTab === 'revenue' && <RevenueTab filters={filters} />}
        {activeTab === 'export' && <ExportTab filters={filters} />}
      </div>
    </div>
  );
}
