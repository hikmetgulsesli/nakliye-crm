import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="material-symbols-outlined text-6xl text-red-400">block</span>
      <h1 className="text-2xl font-display font-semibold text-text-main">
        Erisim Engellendi
      </h1>
      <p className="text-gray-500">
        Bu sayfayi goruntuleme yetkiniz bulunmamaktadir.
      </p>
    </div>
  );
}

export default function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.isAdmin());

  if (!isAdmin) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
