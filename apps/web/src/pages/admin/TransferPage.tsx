import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { TransferForm } from '@/components/admin/TransferForm';
import { userService } from '@/services/user.service';
import type { User } from '@nakliye-crm/shared';

export default function TransferPage() {
  const [users, setUsers] = useState<(User & { customerCount?: number; quoteCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(result.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  function handleTransferComplete() {
    // Refresh user list to get updated counts
    userService.getAll(1, 100).then((result) => {
      setUsers(result.data);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Temsilci Devir' },
        ]}
        title="Temsilci Devir Islemi"
        subtitle="Musteri ve teklif sahipligini temsilciler arasinda aktarin"
        action={
          <Link
            to="/loglar"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-700 transition-colors"
          >
            <Icon name="history" size="sm" />
            Islem Gecmisi
          </Link>
        }
      />

      <TransferForm
        users={users}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
}
