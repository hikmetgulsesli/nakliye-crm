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
    </div>
  );
}
