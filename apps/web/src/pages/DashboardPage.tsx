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
          { label: isAdmin ? 'Genel Bakis' : 'Dashboard' },
        ]}
        title={isAdmin ? 'Genel Bakis' : 'Dashboard'}
        subtitle={
          isAdmin
            ? 'Tum ekip ve satis performansini buradan takip edebilirsiniz.'
            : `Hos geldiniz, ${user?.fullName || 'Kullanici'}.`
        }
      />

      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
