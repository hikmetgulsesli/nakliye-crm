import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getAllUsers } from '@/lib/db/users';
import { UsersTable } from '@/components/users/users-table';

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const users = getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
        <p className="text-slate-600">
          Sistem kullanıcılarını oluşturun, düzenleyin ve yönetin
        </p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
