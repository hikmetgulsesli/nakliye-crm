import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { UserDashboard } from '@/components/dashboard/UserDashboard';

export default function DashboardPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: isAdmin ? 'Genel Bakış' : 'Dashboard' },
        ]}
        title={isAdmin ? 'Genel Bakış' : 'Dashboard'}
        subtitle={
          isAdmin
            ? 'Tüm ekip ve satış performansini buradan takip edebilirsiniz.'
            : `Hoş geldiniz, ${user?.fullName || 'Kullanıcı'}.`
        }
      />

      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
