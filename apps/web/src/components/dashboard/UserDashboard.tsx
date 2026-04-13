import { useAuthStore } from '@/stores/authStore';
import { KPICard } from '@/components/shared/KPICard';
import { AlertWidgets } from './AlertWidgets';
import { FollowUpWidget } from './FollowUpWidget';
import { RecentActivitiesWidget } from './RecentActivitiesWidget';

// --- Mock Data ---

const MOCK_KPIS = [
  {
    icon: 'assignment',
    iconColor: 'blue',
    label: 'Bu Haftaki Teklifler',
    value: 24,
    trend: { value: '+5%', positive: true },
  },
  {
    icon: 'receipt_long',
    iconColor: 'indigo',
    label: 'Bu Ay Teklifler',
    value: 87,
    trend: { value: '+12%', positive: true },
  },
  {
    icon: 'emoji_events',
    iconColor: 'emerald',
    label: 'Kazanilan Teklifler',
    value: 34,
    trend: { value: '+55%', positive: true },
  },
  {
    icon: 'handshake',
    iconColor: 'purple',
    label: 'Gorusulen Musteri',
    value: 52,
    trend: { value: '+8%', positive: true },
  },
];

const MOCK_ALERTS = [
  {
    id: '1',
    type: 'uncalled' as const,
    count: 8,
    description: '14 gundur aranmadi',
  },
  {
    id: '2',
    type: 'pending' as const,
    count: 5,
    description: '7+ gun donus bekliyor',
  },
  {
    id: '3',
    type: 'expired' as const,
    count: 3,
    description: 'Suresi dolan teklifler',
  },
  {
    id: '4',
    type: 'highPotential' as const,
    count: 12,
    description: 'Yuksek potansiyelli musteriler',
  },
];

const MOCK_FOLLOW_UPS = [
  {
    id: '1',
    customerName: 'ABC Lojistik A.S.',
    date: 'Bugun, 14:00',
    type: 'call' as const,
    note: 'Yeni depo projesi icin verilen teklifin durumu gorusulecek.',
  },
  {
    id: '2',
    customerName: 'Kaya Nakliyat',
    date: 'Yarin, 10:30',
    type: 'email' as const,
    note: 'Sozlesme taslagi iletilecek.',
  },
  {
    id: '3',
    customerName: 'Demir Global',
    date: '12 Eki, 15:00',
    type: 'meeting' as const,
    note: 'Yuz yuze tanisma ve ilk analiz toplantisi.',
  },
  {
    id: '4',
    customerName: 'Yildiz Kargo',
    date: '14 Eki, 09:00',
    type: 'call' as const,
    note: 'Fiyat guncellemesi hakkinda bilgilendirme.',
  },
];

const MOCK_ACTIVITIES = [
  {
    id: '1',
    date: '2 saat once',
    customerName: 'Yildiz Kargo',
    type: 'Kazanildi',
    note: '#TK-2023-042 numarali teklif onaylandi.',
    representative: 'Ahmet Yilmaz',
  },
  {
    id: '2',
    date: 'Dun, 16:45',
    customerName: 'Marmara Lojistik',
    type: 'Teklif',
    note: 'Deniz yolu tasimacilik teklifi iletildi.',
    representative: 'Ahmet Yilmaz',
  },
  {
    id: '3',
    date: 'Dun, 11:20',
    customerName: 'Celik A.S.',
    type: 'Not',
    note: 'Butce gorusmeleri haftaya ertelendi.',
    representative: 'Ahmet Yilmaz',
  },
  {
    id: '4',
    date: '2 gun once',
    customerName: 'Boran Nakliyat',
    type: 'Arama',
    note: 'Musteri yeni teklif talep etti.',
    representative: 'Ahmet Yilmaz',
  },
];

export function UserDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] || 'Kullanici';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
          Merhaba, {firstName} <span role="img" aria-label="wave">&#128075;</span>
        </h1>
        <p className="text-slate-500 mt-1">
          Iste bugunku satis ozetiniz ve yapmaniz gerekenler.
        </p>
      </div>

      {/* KPI Cards - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Alert Widgets (2x2) */}
      <AlertWidgets alerts={MOCK_ALERTS} />

      {/* Two column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activities (takes 2 cols) */}
        <div className="lg:col-span-2">
          <RecentActivitiesWidget
            activities={MOCK_ACTIVITIES}
            showRepresentative
          />
        </div>

        {/* Right: Follow-ups sidebar */}
        <div>
          <FollowUpWidget followUps={MOCK_FOLLOW_UPS} />
        </div>
      </div>
    </div>
  );
}
