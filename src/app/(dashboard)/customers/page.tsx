import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import CustomerList from './CustomerList';

export default async function CustomersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <CustomerList />;
}
