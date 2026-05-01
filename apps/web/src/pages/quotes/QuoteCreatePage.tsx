import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormActions } from '@/components/shared/FormActions';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { quotationService } from '@/services/quotation.service';
import { userService } from '@/services/user.service';
import { customerService } from '@/services/customer.service';
import type { QuotationCreateInput, Quotation } from '@nakliye-crm/shared';

export default function QuoteCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerIdParam = searchParams.get('customerId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [prefill, setPrefill] = useState<Partial<Quotation> | undefined>(undefined);
  // ?customerId varsa fetch bitene kadar form'u render etmiyoruz; aksi halde
  // react-hook-form defaultValues'i mount sonrasi guncel almıyor.
  const [prefillReady, setPrefillReady] = useState<boolean>(!customerIdParam);

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
        setError('Kullanıcı listesi yüklenirken bir hata oluştu.');
      }
    }
    fetchUsers();
  }, []);

  // ?customerId=N geldiyse musteriyi cek ve prefill et
  useEffect(() => {
    if (!customerIdParam) return;
    const numCid = Number(customerIdParam);
    if (!Number.isFinite(numCid) || numCid <= 0) {
      setPrefillReady(true);
      return;
    }
    let cancelled = false;
    customerService
      .getById(numCid)
      .then((c) => {
        if (cancelled) return;
        setPrefill({
          customerId: c.id,
          customer: { id: c.id, companyName: c.companyName },
        } as Partial<Quotation>);
      })
      .catch(() => {
        if (!cancelled) setError('Müşteri bilgisi yüklenemedi.');
      })
      .finally(() => {
        if (!cancelled) setPrefillReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [customerIdParam]);

  async function handleSubmit(data: QuotationCreateInput) {
    setLoading(true);
    setError(null);
    try {
      const quotation = await quotationService.create(data);
      navigate(`/teklifler/${quotation.id}`);
    } catch (err) {
      setError('Teklif oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
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
        title="Yeni Teklif Oluştur"
        subtitle={`Yeni bir teklif olusturun`}
        action={
          <FormActions
            formId="quotation-form"
            onCancel={() => navigate('/teklifler')}
            loading={loading}
          />
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

      {prefillReady ? (
        <QuotationForm
          defaultValues={prefill}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/teklifler')}
          loading={loading}
          users={users}
          refId={refId}
        />
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
