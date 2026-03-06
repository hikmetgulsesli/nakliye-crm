import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          Hoş geldiniz, {session.user.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Toplam Müşteri</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Aktif Teklifler</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Bu Ay Teklif</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600">Kazanma Oranı</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">-%</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Son Aktiviteler</h2>
        <p className="mt-4 text-slate-500">Henüz aktivite kaydı bulunmuyor.</p>
      </div>
    </div>
  );
}
