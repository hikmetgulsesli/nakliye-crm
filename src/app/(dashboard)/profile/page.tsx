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
      </div>
    </div>
  );
}
