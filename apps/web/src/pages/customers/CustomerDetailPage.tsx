import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Icon, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CustomerDetailTabs } from '@/components/customers/CustomerDetailTabs';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@nakliye-crm/shared';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await customerService.getById(Number(id));
        setCustomer(data);
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        navigate('/musteriler');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id, navigate]);

  async function handleDelete() {
    if (!customer) return;
    const confirmed = window.confirm(
      `"${customer.companyName}" musterisini silmek istediginize emin misiniz?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await customerService.delete(customer.id);
      navigate('/musteriler');
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-4 w-64 rounded mb-3" />
          <Skeleton className="h-8 w-48 rounded" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Musteriler', href: '/musteriler' },
          { label: customer.companyName },
        ]}
        title={customer.companyName}
      />

      {/* Company header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Company icon */}
          <div className="flex items-center justify-center size-16 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <Icon name="business" size="lg" />
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {customer.companyName}
              </h2>
              <StatusBadge status={customer.status} />
              {customer.potential && (
                <StatusBadge status={customer.potential} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {customer.assignedUser && (
                <span className="flex items-center gap-1.5">
                  <Icon name="person" size="sm" className="text-slate-400" />
                  Temsilci: <span className="text-slate-700 font-medium">{customer.assignedUser.fullName}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon name="phone" size="sm" className="text-slate-400" />
                Son Iletisim: <span className="text-slate-700 font-medium">{formatDate(customer.lastContactDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="request_quote" size="sm" className="text-slate-400" />
                Son Teklif: <span className="text-slate-700 font-medium">{formatDate(customer.lastQuoteDate)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => navigate(`/musteriler/${customer.id}/duzenle`)}
            >
              Duzenle
            </Button>
            <Button
              variant="danger"
              icon="delete"
              onClick={handleDelete}
              loading={deleting}
            >
              Sil
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CustomerDetailTabs customer={customer} />
    </div>
  );
}
