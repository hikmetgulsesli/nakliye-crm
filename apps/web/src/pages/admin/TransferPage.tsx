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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(result.data);
      } catch (err) {
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  function handleTransferComplete() {
    setError(null);
    // Refresh user list to get updated counts
    userService.getAll(1, 100).then((result) => {
      setUsers(result.data);
    }).catch(() => {
      setError('Devir işlemi sonrası kullanıcı listesi yenilenemedi.');
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
        title="Temsilci Devir İşlemi"
        subtitle="Müşteri ve teklif sahipliğini temsilciler arasında aktarın"
        action={
          <Link
            to="/loglar"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-700 transition-colors"
          >
            <Icon name="history" size="sm" />
            İşlem Geçmişi
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <TransferForm
        users={users}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
}
