import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { customerService } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import type { Customer, CustomerCreateInput } from '@nakliye-crm/shared';

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [customerData, usersResult] = await Promise.all([
          customerService.getById(Number(id)),
          userService.getAll(1, 100),
        ]);
        setCustomer(customerData);
        setUsers(
          usersResult.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err) {
        console.error('Failed to fetch customer:', err);
        setError('Musteri bilgileri yuklenirken bir hata olustu.');
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleSubmit(data: CustomerCreateInput) {
    setLoading(true);
    setError(null);
    try {
      await customerService.update(Number(id), data);
      navigate(`/musteriler/${id}`);
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError('Musteri guncellenirken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Musteriler', href: '/musteriler' },
          { label: customer?.companyName || '', href: `/musteriler/${id}` },
          { label: 'Duzenle' },
        ]}
        title="Musteri Duzenle"
      />

      <CustomerForm
        initialData={customer}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/musteriler/${id}`)}
        loading={loading}
        conflictWarning={error}
        users={users}
      />
    </div>
  );
}
