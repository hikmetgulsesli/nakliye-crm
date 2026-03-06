import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Raporlar | Nakliye CRM',
  description: 'Performans raporları',
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground">
          Detaylı performans ve analiz raporları
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Rapor modülü yakında kullanıma sunulacak.</p>
      </div>
    </div>
  );
}
