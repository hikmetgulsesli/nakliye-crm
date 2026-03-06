<<<<<<< HEAD
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Müşteriler | Nakliye CRM',
  description: 'Müşteri yönetimi',
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
        <p className="text-muted-foreground">
          Müşteri kartlarını yönetin
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Müşteri modülü yakında kullanıma sunulacak.</p>
      </div>
    </div>
  );
=======
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import CustomerList from './CustomerList';

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <CustomerList />;
>>>>>>> origin/feature/crm-core-modules
}
