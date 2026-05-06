import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { RouteVisual } from '@/components/shared/RouteVisual';
import { RevisionHistory } from './RevisionHistory';
import { AIEmailDraftModal } from '@/components/ai/AIEmailDraftModal';
import { WinProbabilityBadge } from '@/components/ai/WinProbabilityBadge';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { InlineEditSelect } from '@/components/shared/InlineEditSelect';
import { InternalNotesPanel } from '@/components/notes/InternalNotesPanel';
import { FeatureGate } from '@/components/features/FeatureGate';
import { LossReasonModal } from './LossReasonModal';
import { shipmentService } from '@/services/shipment.service';
import { quotationService } from '@/services/quotation.service';
import type { Quotation, QuotationRevision } from '@nakliye-crm/shared';

const STATUS_OPTIONS = [
  { value: 'Bekliyor', label: 'Bekliyor', pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  { value: 'Kazanıldı', label: 'Kazanıldı', pillClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { value: 'Kaybedildi', label: 'Kaybedildi', pillClass: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300' },
  { value: 'İptal', label: 'İptal', pillClass: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
];

interface QuotationDetailProps {
  quotation: Quotation;
  revisions: QuotationRevision[];
  revisionsLoading?: boolean;
  onEdit: () => void;
  onDownloadPdf: () => void;
  /** Status inline degistiginde parent state'i guncellesin */
  onStatusChanged?: (newStatus: string) => void;
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
  onStatusChanged,
}: QuotationDetailProps) {
  const q = quotation;
  const navigate = useNavigate();
  const transportInfo = q.transportMode ? TRANSPORT_MODE_LABELS[q.transportMode.toLowerCase()] : null;
  const [aiEmailOpen, setAiEmailOpen] = useState(false);
  const [existingShipmentId, setExistingShipmentId] = useState<number | null>(null);

  const isWon = q.status === 'Kazanıldı';
  const [lossModalOpen, setLossModalOpen] = useState(false);

  /**
   * Status degisikligini ortak yoneten handler. "Kaybedildi" secilince once
   * modal acar; modal confirm verince hem status hem lossReason atomik gonderir.
   * Diger statusler dogrudan gider. Reject edildiginde InlineEditSelect revert eder.
   */
  async function handleStatusChange(next: string): Promise<void> {
    if (next === 'Kaybedildi') {
      // Modal acilir; gercek update onun confirm handler'inda olur. Inline'i
      // pending'de tutmak icin hicbir sey yapmiyoruz, modal kapaninca
      // onStatusChanged ile parent kayit tazelenecek.
      setLossModalOpen(true);
      // Modal kapanmadan inline'i basarili sayma — bekleyen bir promise ile
      // durdurmadigimiz icin hemen donelim; modal'da actual update olur.
      // (InlineEditSelect optimistic gosterim yapip parent state'inde kaybedildi
      // gosterecek; modal vazgec'te ise lossModalOpen kapanir, onStatusChanged
      // cagrilmaz, parent state ayni kalir.)
      return;
    }
    await quotationService.update(q.id, { status: next });
    onStatusChanged?.(next);
  }

  async function handleConfirmLossReason(lossReasonCsv: string) {
    await quotationService.update(q.id, {
      status: 'Kaybedildi',
      lossReason: lossReasonCsv,
    });
    onStatusChanged?.('Kaybedildi');
  }

  // Kazanildi tekliflerde mevcut sevkiyat var mi kontrol et
  useEffect(() => {
    if (!isWon) {
      setExistingShipmentId(null);
      return;
    }
    let cancelled = false;
    shipmentService
      .list(1, 1, { quotationId: q.id })
      .then((res) => {
        if (cancelled) return;
        setExistingShipmentId(res.total > 0 ? res.data[0].id : null);
      })
      .catch(() => {
        if (!cancelled) setExistingShipmentId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isWon, q.id]);

  function handleShipmentAction() {
    if (existingShipmentId) {
      navigate(`/sevkiyatlar/${existingShipmentId}`);
    } else {
      navigate(`/sevkiyatlar/yeni?quotationId=${q.id}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <InlineEditSelect
              value={q.status}
              options={STATUS_OPTIONS}
              onSave={handleStatusChange}
            />
            <WinProbabilityBadge quotationId={q.id} status={q.status} />
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
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {isWon && (
            <Button
              variant="primary"
              icon={existingShipmentId ? 'open_in_new' : 'local_shipping'}
              onClick={handleShipmentAction}
              className="!bg-blue-500 hover:!bg-blue-600 !shadow-blue-500/20"
            >
              {existingShipmentId ? 'Sevkiyatı Görüntüle' : 'Sevkiyat Oluştur'}
            </Button>
          )}
          <Button
            variant="primary"
            icon="auto_awesome"
            onClick={() => setAiEmailOpen(true)}
            className="!bg-primary hover:!bg-primary/90 !text-white"
          >
            AI E-posta Taslağı
          </Button>
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

      {/* AI email draft modal */}
      <AIEmailDraftModal
        isOpen={aiEmailOpen}
        onClose={() => setAiEmailOpen(false)}
        quotationId={q.id}
        customerEmail={q.customer?.email || ''}
        customerName={q.customer?.companyName || 'Müşteri'}
      />

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
                <InlineEditSelect
                  value={q.status}
                  options={STATUS_OPTIONS}
                  onSave={handleStatusChange}
                />
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

      {/* İç notlar — teklif uzerine takim icinde */}
      <FeatureGate feature="internal_notes">
        <InternalNotesPanel ownerType="quotation" ownerId={q.id} />
      </FeatureGate>

      {/* Revize Geçmişi */}
      <Card title="Revize Geçmişi" noPadding>
        <div className="px-0">
          <RevisionHistory revisions={revisions} loading={revisionsLoading} />
        </div>
      </Card>

      {/* Dokümanlar */}
      <DocumentsPanel ownerType="quotation" ownerId={q.id} />

      {/* Kaybetme nedeni modal'i — inline status "Kaybedildi" secince acilir */}
      <LossReasonModal
        isOpen={lossModalOpen}
        onClose={() => setLossModalOpen(false)}
        initialValue={q.lossReason}
        onConfirm={handleConfirmLossReason}
      />
    </div>
  );
}
