import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { QuotationDetail } from '@/components/quotations/QuotationDetail';
import { Skeleton } from '@/components/ui';
import { quotationService } from '@/services/quotation.service';
import type { Quotation, QuotationRevision } from '@nakliye-crm/shared';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [revisions, setRevisions] = useState<QuotationRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revisionsLoading, setRevisionsLoading] = useState(true);

  const quotationId = Number(id);

  const fetchQuotation = useCallback(async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const data = await quotationService.getById(quotationId);
      setQuotation(data);
    } catch (err) {
      setError('Teklif bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [quotationId, navigate]);

  const fetchRevisions = useCallback(async () => {
    if (!quotationId) return;
    setRevisionsLoading(true);
    try {
      const data = await quotationService.getRevisions(quotationId);
      setRevisions(data);
    } catch (err) {
      // Revisions are non-critical, silently handle
    } finally {
      setRevisionsLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    fetchQuotation();
    fetchRevisions();
  }, [fetchQuotation, fetchRevisions]);

  function handleEdit() {
    navigate(`/teklifler/${quotationId}/duzenle`);
  }

  function handleDownloadPdf() {
    window.print();
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton variant="text" className="w-48" />
          <Skeleton variant="text" className="w-72 mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-slate-600 dark:text-slate-300">{error}</p>
        <button
          onClick={() => navigate('/teklifler')}
          className="text-sm text-primary hover:underline"
        >
          Teklif listesine don
        </button>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Teklif bulunamadı</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Teklifler', href: '/teklifler' },
          { label: quotation.quoteNo },
        ]}
        title={quotation.quoteNo}
      />

      <QuotationDetail
        quotation={quotation}
        revisions={revisions}
        revisionsLoading={revisionsLoading}
        onEdit={handleEdit}
        onDownloadPdf={handleDownloadPdf}
        onStatusChanged={(newStatus) => {
          setQuotation((prev) => (prev ? { ...prev, status: newStatus } : prev));
          // Revisions yenile cunku audit log'a yeni satir dustu
          fetchRevisions();
        }}
      />
    </div>
  );
}
