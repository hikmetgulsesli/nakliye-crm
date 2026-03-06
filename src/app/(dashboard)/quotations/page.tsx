<<<<<<< HEAD
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
=======
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getQuotations } from '@/lib/db/quotations';
import { QuotationsTable } from '@/components/quotations/quotations-table';

export default async function QuotationsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const quotations = getQuotations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teklifler</h1>
          <p className="text-muted-foreground">
            Tüm teklifleri görüntüleyin ve yönetin
          </p>
        </div>
      </div>

      <QuotationsTable 
        quotations={quotations} 
        isAdmin={session.user.role === 'admin'}
        onRefresh={() => {}}
      />
>>>>>>> origin/feature/crm-core-modules
    </div>
  );
}
