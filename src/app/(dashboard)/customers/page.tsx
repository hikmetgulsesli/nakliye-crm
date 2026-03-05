import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
        <p className="text-slate-600">Müşteri kartları ve yönetimi</p>
      </div>
      
      <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
        <p className="text-slate-500">Müşteri modülü yakında eklenecek</p>
      </div>
    </div>
  );
}
