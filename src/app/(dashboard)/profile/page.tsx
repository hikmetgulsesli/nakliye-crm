<<<<<<< HEAD
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil | Nakliye CRM',
  description: 'Profil ayarları',
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Profil bilgilerinizi yönetin
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Profil modülü yakında kullanıma sunulacak.</p>
=======
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
        <p className="text-slate-600">Hesap bilgileriniz</p>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
            <p className="mt-1 text-slate-900">{session.user.full_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">E-posta</label>
            <p className="mt-1 text-slate-900">{session.user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Rol</label>
            <p className="mt-1 text-slate-900 capitalize">{session.user.role}</p>
          </div>
        </div>
>>>>>>> origin/feature/crm-core-modules
      </div>
    </div>
  );
}
