import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teklifler | Nakliye CRM',
  description: 'Teklif yönetimi',
};

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teklifler</h1>
        <p className="text-muted-foreground">
          Nakliye tekliflerini yönetin
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Teklif modülü yakında kullanıma sunulacak.</p>
      </div>
    </div>
  );
}
