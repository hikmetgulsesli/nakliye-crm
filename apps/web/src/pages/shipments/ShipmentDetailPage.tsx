import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Icon, Skeleton, Select, Modal } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { InternalNotesPanel } from '@/components/notes/InternalNotesPanel';
import { FeatureGate } from '@/components/features/FeatureGate';
import {
  shipmentService,
  type Shipment,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/shipment.service';

function formatDT(dt?: string | null): string {
  if (!dt) return '-';
  return new Date(dt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [s, setS] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  async function refresh() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await shipmentService.getById(Number(id));
      setS(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !s) return <Skeleton variant="card" />;
  if (!s) return <div>Sevkiyat bulunamadı.</div>;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sevkiyatlar', href: '/sevkiyatlar' },
          { label: s.shipmentNo },
        ]}
        title={s.shipmentNo}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => navigate(`/sevkiyatlar/${s.id}/duzenle`)}
            >
              Düzenle
            </Button>
            {(s.allowedNextStatuses?.length ?? 0) > 0 && (
              <Button
                variant="primary"
                icon="route"
                onClick={() => setStatusModalOpen(true)}
              >
                Durum Değiştir
              </Button>
            )}
          </div>
        }
      />

      {/* Status + route */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[s.status]}`}
          >
            {STATUS_LABELS[s.status]}
          </span>
          {s.quotationId && (
            <Link
              to={`/teklifler/${s.quotationId}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Icon name="description" size="sm" />
              İlgili Teklif
            </Link>
          )}
          {s.customer && (
            <Link
              to={`/musteriler/${s.customerId}`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Icon name="business" size="sm" />
              {s.customer.companyName}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <Field label="BL No" value={s.blNumber || '-'} />
          <Field label="AWB No" value={s.awbNumber || '-'} />
          <Field label="Taşıma" value={s.transportMode || '-'} />
          <Field label="Servis" value={s.serviceType || '-'} />
          <Field
            label="Çıkış"
            value={`${s.originCountry || '-'}${s.pol ? ' / ' + s.pol : ''}`}
          />
          <Field
            label="Varış"
            value={`${s.destinationCountry || '-'}${s.pod ? ' / ' + s.pod : ''}`}
          />
          <Field label="ETD" value={formatDT(s.etd)} />
          <Field label="ETA" value={formatDT(s.eta)} />
          <Field label="ATD" value={formatDT(s.atd)} />
          <Field label="ATA" value={formatDT(s.ata)} />
        </div>

        {s.pickupAddress && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
              Yükleme Adresi
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {s.pickupAddress}
            </div>
          </div>
        )}

        {s.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Notlar</div>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {s.notes}
            </div>
          </div>
        )}
      </div>

      {/* Containers */}
      <Card title={`Konteynerler (${s.containers?.length ?? 0})`} className="mb-6">
        {!s.containers || s.containers.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Konteyner eklenmemiş.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 text-left">
              <tr>
                <th className="py-2">Konteyner No</th>
                <th className="py-2">Mühür</th>
                <th className="py-2">Tip</th>
                <th className="py-2">Ağırlık (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {s.containers.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 font-mono">{c.containerNo}</td>
                  <td className="py-2">{c.sealNo || '-'}</td>
                  <td className="py-2">{c.type || '-'}</td>
                  <td className="py-2">{c.weightKg ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* İç notlar — operasyon ekibi takim notu */}
      <FeatureGate feature="internal_notes">
        <div className="mb-6">
          <InternalNotesPanel ownerType="shipment" ownerId={s.id} />
        </div>
      </FeatureGate>

      {/* Documents */}
      <div className="mb-6">
        <DocumentsPanel ownerType="shipment" ownerId={s.id} />
      </div>

      {/* Timeline */}
      <Card title="Olay Zaman Çizelgesi">
        {!s.events || s.events.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Olay kaydı yok.</p>
        ) : (
          <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-5 space-y-4">
            {s.events.map((e) => (
              <li key={e.id} className="relative">
                <div className="absolute -left-[27px] size-4 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(e.occurredAt).toLocaleString('tr-TR')}
                  </span>
                  {e.toStatus && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[e.toStatus] || ''}`}
                    >
                      {STATUS_LABELS[e.toStatus] || e.toStatus}
                    </span>
                  )}
                </div>
                {e.note && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{e.note}</p>
                )}
                {e.location && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Icon name="location_on" size="sm" />
                    {e.location}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {statusModalOpen && (
        <StatusChangeModal
          shipment={s}
          onClose={() => setStatusModalOpen(false)}
          onSaved={() => {
            setStatusModalOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function StatusChangeModal({
  shipment,
  onClose,
  onSaved,
}: {
  shipment: Shipment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [toStatus, setToStatus] = useState(shipment.allowedNextStatuses?.[0] || '');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await shipmentService.changeStatus(shipment.id, toStatus, note || undefined, location || undefined);
      onSaved();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Durum değiştirilemedi',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Sevkiyat Durumunu Değiştir"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={!toStatus}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Yeni Durum"
          value={toStatus}
          onChange={(e) => setToStatus(e.target.value)}
          options={(shipment.allowedNextStatuses ?? []).map((s) => ({
            value: s,
            label: STATUS_LABELS[s] || s,
          }))}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Not (opsiyonel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[60px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-3"
            placeholder="Durum değişiminin sebebi veya detay..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Konum (opsiyonel)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3"
            placeholder="Örn: İstanbul Liman, Hamburg Gümrük"
          />
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
