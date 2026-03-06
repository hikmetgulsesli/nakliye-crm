import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getAllCustomers } from '@/lib/db/customers';
import { CustomersTable } from '@/components/customers/customers-table';

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const customers = getAllCustomers();
  const isAdmin = session.user.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
        <p className="text-slate-600">Müşteri kartları ve yönetimi</p>
      </div>
      
      <CustomersTable 
        customers={customers} 
        isAdmin={isAdmin}
        onRefresh={() => {}} 
      />
    </div>
  );
}
