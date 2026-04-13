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
  const [revisionsLoading, setRevisionsLoading] = useState(true);

  const quotationId = Number(id);

  const fetchQuotation = useCallback(async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const data = await quotationService.getById(quotationId);
      setQuotation(data);
    } catch (error) {
      console.error('Failed to fetch quotation:', error);
      navigate('/teklifler');
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
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
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
    // PDF download functionality - placeholder
    window.open(`/api/quotations/${quotationId}/pdf`, '_blank');
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

  if (!quotation) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Teklif bulunamadi</p>
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
        title=""
      />

      <QuotationDetail
        quotation={quotation}
        revisions={revisions}
        revisionsLoading={revisionsLoading}
        onEdit={handleEdit}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}
