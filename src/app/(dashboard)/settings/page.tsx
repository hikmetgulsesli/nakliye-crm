<<<<<<< HEAD
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayarlar | Nakliye CRM',
  description: 'Sistem ayarları',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Sistem ayarlarını ve lookup değerlerini yönetin
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Ayarlar modülü yakında kullanıma sunulacak.</p>
=======
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function SettingsPage() {
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
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-600">Sistem ayarları ve yapılandırma</p>
      </div>
      
      <div className="rounded-lg border bg-white p-12 shadow-sm text-center">
        <p className="text-slate-500">Ayarlar modülü yakında eklenecek</p>
>>>>>>> origin/feature/crm-core-modules
      </div>
    </div>
  );
}
