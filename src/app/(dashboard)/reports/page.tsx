import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
        <p className="text-slate-600">Detaylı raporlar ve analizler</p>
      </div>
      
      <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
        <p className="text-slate-500">Rapor modülü yakında eklenecek</p>
      </div>
    </div>
  );
}
