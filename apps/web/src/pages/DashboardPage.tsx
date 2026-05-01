import { useAuthStore } from '@/stores/authStore';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AISignalsStrip } from '@/components/dashboard/AISignalsStrip';
import { FeatureGate } from '@/components/features/FeatureGate';
import { Button } from '@/components/ui';

function getGreeting(now: Date): string {
  const h = now.getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function formatStamp(d: Date): string {
  // Örn: "Cuma, 02 Mayıs · 22:46"
  const date = d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export default function DashboardPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Kullanıcı';
  const now = new Date();

  return (
    <div>
      {/* Greeting header — sade: tarih+saat kucuk, isim buyuk, alt aciklama yok */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[12px] font-medium text-token-muted">{formatStamp(now)}</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-token-text">
            {getGreeting(now)}, {firstName} 👋
          </h1>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            icon="refresh"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Yenile
          </Button>
          <Button
            variant="primary"
            icon="add"
            size="sm"
            onClick={() => (window.location.href = '/teklifler/yeni')}
          >
            Yeni teklif
          </Button>
        </div>
      </div>

      {/* AI sinyaller stripi — feature flag'e bagli, hata durumunda sessizce gizlenir */}
      <FeatureGate feature="smart_queue">
        <AISignalsStrip />
      </FeatureGate>

      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
