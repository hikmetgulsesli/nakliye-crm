import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Textarea, DatePicker, Icon } from '@/components/ui';
import { PageHeader } from '@/components/shared/PageHeader';
import { useLookups } from '@/hooks/useLookups';
import { customerService } from '@/services/customer.service';
import { quotationService } from '@/services/quotation.service';
import { shipmentService } from '@/services/shipment.service';
import type { Customer } from '@nakliye-crm/shared';
import { cn } from '@/utils/cn';

interface FormState {
  customerId: number | undefined;
  customerName: string;
  quotationId: number | undefined;
  quotationNo: string;
  transportMode: string;
  serviceType: string;
  originCountry: string;
  pol: string;
  destinationCountry: string;
  pod: string;
  etd: string;
  eta: string;
  blNumber: string;
  awbNumber: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  customerId: undefined,
  customerName: '',
  quotationId: undefined,
  quotationNo: '',
  transportMode: '',
  serviceType: '',
  originCountry: '',
  pol: '',
  destinationCountry: '',
  pod: '',
  etd: '',
  eta: '',
  blNumber: '',
  awbNumber: '',
  notes: '',
};

export default function ShipmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getOptions } = useLookups();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const [existingShipmentId, setExistingShipmentId] = useState<number | null>(null);

  // Müşteri arama (gerekiyorsa)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  const transportModeOptions = useMemo(
    () => [{ value: '', label: 'Seçiniz' }, ...getOptions('transport_mode')],
    [getOptions],
  );
  const serviceTypeOptions = useMemo(
    () => [{ value: '', label: 'Seçiniz' }, ...getOptions('service_type')],
    [getOptions],
  );
  const countryOptions = useMemo(
    () => [{ value: '', label: 'Seçiniz' }, ...getOptions('country')],
    [getOptions],
  );

  // Query string'ten prefill (teklif → sevkiyat akışı)
  useEffect(() => {
    const quotationId = searchParams.get('quotationId');
    if (!quotationId) return;
    const qid = Number(quotationId);
    if (!Number.isFinite(qid) || qid <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        const [quote, shipmentList] = await Promise.all([
          quotationService.getById(qid),
          shipmentService.list(1, 1, { quotationId: qid }),
        ]);
        if (cancelled) return;

        if (shipmentList.total > 0 && shipmentList.data[0]) {
          const existing = shipmentList.data[0];
          setExistingShipmentId(existing.id);
          setPrefillNotice(
            `Bu teklif için zaten sevkiyat oluşturulmuş: ${existing.shipmentNo}`,
          );
          return;
        }

        setForm((prev) => ({
          ...prev,
          customerId: quote.customerId,
          customerName: quote.customer?.companyName ?? '',
          quotationId: quote.id,
          quotationNo: quote.quoteNo,
          transportMode: quote.transportMode ?? '',
          serviceType: quote.serviceType ?? '',
          originCountry: quote.originCountry ?? '',
          pol: quote.pol ?? '',
          destinationCountry: quote.destinationCountry ?? '',
          pod: quote.pod ?? '',
        }));
        setPrefillNotice(`${quote.quoteNo} numaralı tekliften bilgiler aktarıldı.`);
      } catch (err) {
        if (!cancelled) setError('Teklif bilgileri yüklenemedi.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Müşteri arama debounce
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const result = await customerService.getAll(1, 10, { search: customerSearch });
        if (!cancelled) setCustomerResults(result.data);
      } catch {
        if (!cancelled) setCustomerResults([]);
      } finally {
        if (!cancelled) setCustomerSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customerSearch]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function pickCustomer(c: Customer) {
    setForm((prev) => ({ ...prev, customerId: c.id, customerName: c.companyName }));
    setCustomerSearch('');
    setCustomerResults([]);
    setCustomerDropdownOpen(false);
  }

  function clearCustomer() {
    setForm((prev) => ({ ...prev, customerId: undefined, customerName: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.customerId) {
      setError('Müşteri seçimi zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: form.customerId,
        quotationId: form.quotationId,
        transportMode: form.transportMode || undefined,
        serviceType: form.serviceType || undefined,
        originCountry: form.originCountry || undefined,
        pol: form.pol || undefined,
        destinationCountry: form.destinationCountry || undefined,
        pod: form.pod || undefined,
        etd: form.etd || undefined,
        eta: form.eta || undefined,
        blNumber: form.blNumber || undefined,
        awbNumber: form.awbNumber || undefined,
        notes: form.notes || undefined,
      };
      const created = await shipmentService.create(payload);
      navigate(`/sevkiyatlar/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sevkiyat oluşturulurken bir hata oluştu.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sevkiyatlar', href: '/sevkiyatlar' },
          { label: 'Yeni Sevkiyat' },
        ]}
        title="Yeni Sevkiyat"
        subtitle={
          form.quotationNo
            ? `${form.quotationNo} teklifinden oluşturuluyor`
            : 'Sevkiyat bilgilerini girin'
        }
      />

      {prefillNotice && (
        <div
          className={cn(
            'mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm',
            existingShipmentId
              ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
          )}
        >
          <Icon
            name={existingShipmentId ? 'warning' : 'check_circle'}
            size="sm"
            className="mt-0.5 flex-shrink-0"
          />
          <div className="flex-1">{prefillNotice}</div>
          {existingShipmentId && (
            <button
              type="button"
              onClick={() => navigate(`/sevkiyatlar/${existingShipmentId}`)}
              className="flex-shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200"
            >
              Sevkiyatı Aç
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <Icon name="error" size="sm" className="mr-1 align-text-bottom" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Müşteri */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Müşteri
          </h3>
          {form.customerId ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Icon name="business" size="sm" className="text-slate-500" />
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {form.customerName}
                </span>
                {form.quotationId && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Teklif: {form.quotationNo}
                  </span>
                )}
              </div>
              {!form.quotationId && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                >
                  <Icon name="close" size="sm" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Müşteri ara (en az 2 karakter)..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerDropdownOpen(true);
                }}
                onFocus={() => setCustomerDropdownOpen(true)}
                icon="search"
              />
              {customerDropdownOpen && customerSearch.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {customerSearchLoading ? (
                    <div className="p-3 text-center text-sm text-slate-400">
                      <Icon name="progress_activity" className="animate-spin" /> Aranıyor...
                    </div>
                  ) : customerResults.length === 0 ? (
                    <div className="p-3 text-center text-sm text-slate-400">Sonuç yok</div>
                  ) : (
                    customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCustomer(c)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Icon name="business" size="sm" className="text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {c.companyName}
                          </div>
                          {c.contactName && (
                            <div className="text-xs text-slate-500">{c.contactName}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Lojistik */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lojistik
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Taşıma Modu"
              options={transportModeOptions}
              value={form.transportMode}
              onChange={(e) => set('transportMode', e.target.value)}
            />
            <Select
              label="Servis Tipi"
              options={serviceTypeOptions}
              value={form.serviceType}
              onChange={(e) => set('serviceType', e.target.value)}
            />
            <Input
              label="BL Numarası"
              value={form.blNumber}
              onChange={(e) => set('blNumber', e.target.value)}
              placeholder="Konşimento no"
            />
            <Input
              label="AWB Numarası"
              value={form.awbNumber}
              onChange={(e) => set('awbNumber', e.target.value)}
              placeholder="Hava konşimentosu"
            />
          </div>
        </section>

        {/* Lokasyon */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lokasyon
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Çıkış Ülkesi"
              options={countryOptions}
              value={form.originCountry}
              onChange={(e) => set('originCountry', e.target.value)}
            />
            <Input
              label="Yükleme Limanı (POL)"
              value={form.pol}
              onChange={(e) => set('pol', e.target.value)}
              placeholder="Ör. Ambarlı"
            />
            <Select
              label="Varış Ülkesi"
              options={countryOptions}
              value={form.destinationCountry}
              onChange={(e) => set('destinationCountry', e.target.value)}
            />
            <Input
              label="Tahliye Limanı (POD)"
              value={form.pod}
              onChange={(e) => set('pod', e.target.value)}
              placeholder="Ör. Hamburg"
            />
          </div>
        </section>

        {/* Tarih */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tarih Bilgileri
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="ETD (Tahmini Çıkış)"
              value={form.etd}
              onChange={(e) => set('etd', e.target.value)}
            />
            <DatePicker
              label="ETA (Tahmini Varış)"
              value={form.eta}
              onChange={(e) => set('eta', e.target.value)}
            />
          </div>
        </section>

        {/* Notlar */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Notlar
          </h3>
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Operasyon notları, özel talimatlar..."
            rows={4}
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/sevkiyatlar')}
          >
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon="save"
            disabled={submitting || !!existingShipmentId}
          >
            {submitting ? 'Kaydediliyor...' : 'Sevkiyat Oluştur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
