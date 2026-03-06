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
      </div>
    </div>
  );
}
