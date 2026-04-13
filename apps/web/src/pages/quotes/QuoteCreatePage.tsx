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
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }
    fetchUsers();
  }, []);

  async function handleSubmit(data: QuotationCreateInput) {
    setLoading(true);
    try {
      const quotation = await quotationService.create(data);
      navigate(`/teklifler/${quotation.id}`);
    } catch (error) {
      console.error('Failed to create quotation:', error);
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
