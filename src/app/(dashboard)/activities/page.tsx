import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aktiviteler | Nakliye CRM',
  description: 'Aktivite takibi',
};

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aktiviteler</h1>
        <p className="text-muted-foreground">
          Müşteri görüşme ve aktivitelerini takip edin
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aktivite modülü yakında kullanıma sunulacak.</p>
      </div>
    </div>
  );
}
