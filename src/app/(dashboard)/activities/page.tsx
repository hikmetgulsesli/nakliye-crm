import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function ActivitiesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aktiviteler</h1>
        <p className="text-slate-600">Görüşme ve aktivite takibi</p>
      </div>
      
      <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
        <p className="text-slate-500">Aktivite modülü yakında eklenecek</p>
      </div>
    </div>
  );
}
