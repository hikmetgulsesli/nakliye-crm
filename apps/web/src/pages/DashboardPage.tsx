import { useAuthStore } from '@/stores/authStore';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { Button } from '@/components/ui';

function getGreeting(now: Date): string {
  const h = now.getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Kullanıcı';
  const now = new Date();

  return (
    <div>
      {/* Greeting header — tasarimdaki Dashboard ust bilgisi */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[12px] font-medium text-token-muted">
            {formatDateLong(now)} · {formatTime(now)}
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-token-text">
            {getGreeting(now)}, {firstName} 👋
          </h1>
          <p className="mt-1 text-[13px] text-token-muted">
            {isAdmin
              ? 'Tüm ekip ve satış performansını buradan takip edebilirsiniz.'
              : 'Bugünün takipleri, açık tekliflerin ve aktif sevkiyatların burada.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button variant="secondary" icon="refresh" size="sm" onClick={() => window.location.reload()}>
            Yenile
          </Button>
          <Button variant="primary" icon="add" size="sm" onClick={() => (window.location.href = '/teklifler/yeni')}>
            Yeni teklif
          </Button>
        </div>
      </div>

      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
