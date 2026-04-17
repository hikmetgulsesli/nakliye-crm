import { Link } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RouteVisual } from '@/components/shared/RouteVisual';
import { RevisionHistory } from './RevisionHistory';
import type { Quotation, QuotationRevision } from '@nakliye-crm/shared';

interface QuotationDetailProps {
  quotation: Quotation;
  revisions: QuotationRevision[];
  revisionsLoading?: boolean;
  onEdit: () => void;
  onDownloadPdf: () => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPrice(price?: number | null): string {
  if (price == null) return '-';
  return price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCurrencySymbol(currency?: string | null): string {
  if (currency === 'USD') return '$';
  if (currency === 'EUR') return '\u20AC';
  if (currency === 'TRY') return '\u20BA';
  return '';
}

const TRANSPORT_MODE_LABELS: Record<string, { label: string; icon: string }> = {
  deniz: { label: 'Deniz Yolu', icon: 'directions_boat' },
  hava: { label: 'Hava Yolu', icon: 'flight' },
  kara: { label: 'Kara Yolu', icon: 'local_shipping' },
  demiryolu: { label: 'Demiryolu', icon: 'train' },
};

export function QuotationDetail({
  quotation,
  revisions,
  revisionsLoading,
  onEdit,
  onDownloadPdf,
}: QuotationDetailProps) {
  const q = quotation;
  const transportInfo = q.transportMode ? TRANSPORT_MODE_LABELS[q.transportMode.toLowerCase()] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{q.quoteNo}</h2>
            <StatusBadge status={q.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            {q.customer && (
              <Link
                to={`/musteriler/${q.customerId}`}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <Icon name="business" size="sm" />
                {q.customer.companyName}
              </Link>
            )}
            <span className="flex items-center gap-1">
              <Icon name="calendar_today" size="sm" />
              {formatDate(q.quoteDate)}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="schedule" size="sm" />
              Geçerlilik: {formatDate(q.validityDate)}
            </span>
            {q.assignedUser && (
              <span className="flex items-center gap-1.5">
                <Avatar name={q.assignedUser.fullName} size="sm" />
                {q.assignedUser.fullName}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="primary"
            icon="edit"
            onClick={onEdit}
            className="!bg-emerald-500 hover:!bg-emerald-600 !shadow-emerald-500/20"
          >
            Düzenle
          </Button>
          <Button variant="secondary" icon="picture_as_pdf" onClick={onDownloadPdf}>
            PDF Indir
          </Button>
        </div>
      </div>

      {/* Two cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yuk Bilgileri Card */}
        <Card title="Yuk Bilgileri">
          <div className="space-y-5">
            {/* Route visual large */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <RouteVisual
                originCountry={q.originCountry}
                pol={q.pol}
                destinationCountry={q.destinationCountry}
                pod={q.pod}
                transportMode={q.transportMode}
                size="lg"
              />
            </div>

            {/* Transport mode info */}
            {transportInfo && (
              <div className="flex items-center gap-3 px-1">
                <div className="flex items-center justify-center size-10 rounded-xl bg-blue-50 text-blue-600">
                  <Icon name={transportInfo.icon} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{transportInfo.label}</p>
                  {q.serviceType && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{q.serviceType}</p>
                  )}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Çıkış Ülkesi</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.originCountry || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Varış Ülkesi</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.destinationCountry || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Incoterms</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.incoterm || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Revize Sayısı</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.revisionCount}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Fiyat Bilgileri Card */}
        <Card title="Fiyat Bilgileri">
          <div className="space-y-5">
            {/* Large price display */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {getCurrencySymbol(q.currency)}
                {formatPrice(q.price)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{q.currency || ''}</p>
            </div>

            {/* Validity + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Geçerlilik Tarihi</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(q.validityDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Durum</p>
                <StatusBadge status={q.status} />
              </div>
            </div>

            {/* Price note */}
            {q.priceNote && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Fiyat Notu</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{q.priceNote}</p>
              </div>
            )}

            {/* Loss reason */}
            {q.status === 'Kaybedildi' && q.lossReason && (
              <div className="border-t border-red-100 pt-4 bg-red-50 rounded-xl -mx-2 px-4 py-3">
                <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Kaybedilme Nedeni</p>
                <p className="text-sm text-red-700">{q.lossReason}</p>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              <div>
                <p className="uppercase tracking-wider mb-1">Olusturan</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{q.createdBy?.fullName || '-'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wider mb-1">Oluşturulma</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{formatDate(q.createdAt)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Revize Geçmişi */}
      <Card title="Revize Geçmişi" noPadding>
        <div className="px-0">
          <RevisionHistory revisions={revisions} loading={revisionsLoading} />
        </div>
      </Card>
    </div>
  );
}
