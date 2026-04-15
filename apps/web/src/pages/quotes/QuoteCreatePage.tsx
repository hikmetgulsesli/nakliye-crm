import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { quotationService } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import type { QuotationCreateInput } from '@nakliye-crm/shared';

export default function QuoteCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  // Generate a temporary ref ID for display
  const year = new Date().getFullYear();
  const refId = `TKF-${year}-XXXX`;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await userService.getAll(1, 100);
        setUsers(
          result.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err) {
        setError('Kullanici listesi yuklenirken bir hata olustu.');
      }
    }
    fetchUsers();
  }, []);

  async function handleSubmit(data: QuotationCreateInput) {
    setLoading(true);
    setError(null);
    try {
      const quotation = await quotationService.create(data);
      navigate(`/teklifler/${quotation.id}`);
    } catch (err) {
      setError('Teklif olusturulurken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Teklifler', href: '/teklifler' },
          { label: 'Yeni Teklif' },
        ]}
        title="Yeni Teklif Olustur"
        subtitle={`Yeni bir teklif olusturun`}
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <QuotationForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/teklifler')}
        loading={loading}
        users={users}
        refId={refId}
      />
    </div>
  );
}
