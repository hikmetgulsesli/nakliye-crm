import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';
import { KPICard } from '@/components/shared/KPICard';
import { TeamPerformanceTable } from './TeamPerformanceTable';
import { CountryDensityChart } from './CountryDensityChart';
import { TransportModeChart } from './TransportModeChart';
import { LossReasonsChart } from './LossReasonsChart';

// --- Mock Data ---

const PERIOD_TABS = [
  { key: 'this_week', label: 'Bu Hafta' },
  { key: 'this_month', label: 'Bu Ay' },
  { key: 'last_month', label: 'Gecen Ay' },
  { key: 'custom', label: 'Ozel Aralik' },
];

const MOCK_KPIS = [
  {
    icon: 'description',
    iconColor: 'blue',
    label: 'Verilen Teklif (Bu Ay)',
    value: 156,
    trend: { value: '+14%', positive: true },
  },
  {
    icon: 'check_circle',
    iconColor: 'emerald',
    label: 'Kazanilan',
    value: 64,
    trend: { value: '+8%', positive: true },
  },
  {
    icon: 'track_changes',
    iconColor: 'purple',
    label: 'Kazanma Orani',
    value: '%41',
  },
  {
    icon: 'groups',
    iconColor: 'slate',
    label: 'Aktif Musteri',
    value: 234,
    trend: { value: 'Stabil', positive: true },
  },
  {
    icon: 'star',
    iconColor: 'amber',
    label: 'Yuksek Potansiyel',
    value: 28,
    trend: { value: '+12', positive: true },
  },
];

const MOCK_TEAM: Array<{
  id: string;
  name: string;
  avatarUrl?: string | null;
  quoteCount: number;
  wonCount: number;
  winRate: number;
  contactedCustomers: number;
  lastActivity: string;
  isTopPerformer?: boolean;
}> = [
  {
    id: '1',
    name: 'Ahmet Yilmaz',
    quoteCount: 45,
    wonCount: 28,
    winRate: 62,
    contactedCustomers: 120,
    lastActivity: '2 saat once',
    isTopPerformer: true,
  },
  {
    id: '2',
    name: 'Ayse Demir',
    quoteCount: 38,
    wonCount: 22,
    winRate: 58,
    contactedCustomers: 95,
    lastActivity: '4 saat once',
  },
  {
    id: '3',
    name: 'Mehmet Kaya',
    quoteCount: 25,
    wonCount: 12,
    winRate: 48,
    contactedCustomers: 70,
    lastActivity: 'Dun',
  },
  {
    id: '4',
    name: 'Fatma Celik',
    quoteCount: 17,
    wonCount: 6,
    winRate: 35,
    contactedCustomers: 50,
    lastActivity: '2 gun once',
  },
];

const MOCK_ORIGIN_COUNTRIES = [
  { country: 'Cin', flag: '\uD83C\uDDE8\uD83C\uDDF3', percentage: 42, count: 452 },
  { country: 'Almanya', flag: '\uD83C\uDDE9\uD83C\uDDEA', percentage: 28, count: 215 },
  { country: 'ABD', flag: '\uD83C\uDDFA\uD83C\uDDF8', percentage: 18, count: 148 },
  { country: 'Ingiltere', flag: '\uD83C\uDDEC\uD83C\uDDE7', percentage: 12, count: 96 },
];

const MOCK_DESTINATION_COUNTRIES = [
  { country: 'ABD', flag: '\uD83C\uDDFA\uD83C\uDDF8', percentage: 38, count: 385 },
  { country: 'BAE', flag: '\uD83C\uDDE6\uD83C\uDDEA', percentage: 22, count: 192 },
  { country: 'Fransa', flag: '\uD83C\uDDEB\uD83C\uDDF7', percentage: 20, count: 164 },
  { country: 'Rusya', flag: '\uD83C\uDDF7\uD83C\uDDFA', percentage: 14, count: 112 },
];

const MOCK_TRANSPORT_MODES = [
  { mode: 'Deniz', percentage: 50, color: 'blue' },
  { mode: 'Kara', percentage: 25, color: 'emerald' },
  { mode: 'Hava', percentage: 15, color: 'amber' },
  { mode: 'Kombine', percentage: 10, color: 'purple' },
];

const MOCK_LOSS_REASONS = [
  { reason: 'Fiyat', percentage: 45, count: 32 },
  { reason: 'Rakip', percentage: 30, count: 21 },
  { reason: 'Termin', percentage: 25, count: 18 },
];

export function AdminDashboard() {
  const [activePeriod, setActivePeriod] = useState('this_month');
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Filter Tabs + Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePeriod(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activePeriod === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button icon="add" onClick={() => navigate('/teklifler/yeni')}>
          Yeni Teklif Olustur
        </Button>
      </div>

      {/* KPI Cards - 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {MOCK_KPIS.map((kpi, i) => (
          <KPICard
            key={i}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Team Performance Table */}
      <TeamPerformanceTable data={MOCK_TEAM} />

      {/* Bottom Row: 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Country Density */}
        <CountryDensityChart
          originCountries={MOCK_ORIGIN_COUNTRIES}
          destinationCountries={MOCK_DESTINATION_COUNTRIES}
        />

        {/* Right: Transport Mode + Loss Reasons stacked */}
        <div className="flex flex-col gap-8">
          <TransportModeChart data={MOCK_TRANSPORT_MODES} />
          <LossReasonsChart data={MOCK_LOSS_REASONS} />
        </div>
      </div>
    </div>
  );
}
