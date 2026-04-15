import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { quotationService } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import type { Quotation, QuotationCreateInput } from '@nakliye-crm/shared';

export default function QuoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [quoteData, usersResult] = await Promise.all([
          quotationService.getById(Number(id)),
          userService.getAll(1, 100),
        ]);
        setQuotation(quoteData);
        setUsers(
          usersResult.data
            .filter((u) => u.isActive)
            .map((u) => ({
              value: u.id.toString(),
              label: u.fullName,
            })),
        );
      } catch (err: unknown) {
        setError('Teklif bilgileri yuklenirken bir hata olustu.');
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleSubmit(data: QuotationCreateInput) {
    setLoading(true);
    setError(null);
    try {
      await quotationService.update(Number(id), data);
      navigate(`/teklifler/${id}`);
    } catch (err: unknown) {
      setError('Teklif guncellenirken bir hata olustu.');
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

  if (error && !quotation) {
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
          { label: 'Teklifler', href: '/teklifler' },
          { label: quotation?.quoteNo || '', href: `/teklifler/${id}` },
          { label: 'Duzenle' },
        ]}
        title="Teklif Duzenle"
        subtitle={quotation?.quoteNo ? `${quotation.quoteNo} numarali teklifi duzenliyorsunuz` : ''}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <QuotationForm
        defaultValues={quotation ?? undefined}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/teklifler/${id}`)}
        loading={loading}
        users={users}
        refId={quotation?.quoteNo}
      />
    </div>
  );
}
