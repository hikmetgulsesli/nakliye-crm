import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, DatePicker, Textarea, Button, Card, Icon } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { customerService } from '@/services/customer.service';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { Customer, Quotation } from '@nakliye-crm/shared';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const quotationSchema = z.object({
  customerId: z.number({ required_error: 'Müşteri seçimi zorunludur' }).min(1, 'Müşteri seçimi zorunludur'),
  quoteDate: z.string().min(1, 'Teklif tarihi zorunludur'),
  validityDate: z.string().min(1, 'Geçerlilik tarihi zorunludur'),
  transportMode: z.string().optional(),
  serviceType: z.string().optional(),
  originCountry: z.string().optional(),
  pol: z.string().optional(),
  destinationCountry: z.string().optional(),
  pod: z.string().optional(),
  incoterm: z.string().optional(),
  // Backend price'ı Decimal olarak string serialize ediyor; gelen "95" gibi
  // degerleri number'a coerce et, bos string undefined kalsin.
  price: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().optional(),
  ),
  currency: z.string().optional(),
  priceNote: z.string().optional(),
  status: z.string().optional(),
  lossReason: z.string().optional(),
  assignedUserId: z.number({ required_error: 'Temsilci seçimi zorunludur' }).min(1, 'Temsilci seçimi zorunludur'),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface QuotationFormProps {
  defaultValues?: Partial<Quotation>;
  onSubmit: (data: QuotationFormData) => void;
  onCancel: () => void;
  onSaveDraft?: (data: Partial<QuotationFormData>) => void;
  loading?: boolean;
  users: { value: string; label: string }[];
  refId?: string;
  formId?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TRANSPORT_MODES = [
  { value: 'deniz', label: 'Deniz', icon: 'directions_boat' },
  { value: 'hava', label: 'Hava', icon: 'flight' },
  { value: 'kara', label: 'Kara', icon: 'local_shipping' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'TRY', label: 'TRY (\u20BA)' },
];

const STATUS_OPTIONS = [
  { value: 'Bekliyor', label: 'Bekliyor' },
  { value: 'Kazanıldı', label: 'Kazanıldı' },
  { value: 'Kaybedildi', label: 'Kaybedildi' },
];

const COUNTRY_OPTIONS = [
  { value: 'TR', label: '\u{1F1F9}\u{1F1F7} Türkiye' },
  { value: 'CN', label: '\u{1F1E8}\u{1F1F3} Çin' },
  { value: 'US', label: '\u{1F1FA}\u{1F1F8} ABD' },
  { value: 'DE', label: '\u{1F1E9}\u{1F1EA} Almanya' },
  { value: 'GB', label: '\u{1F1EC}\u{1F1E7} İngiltere' },
  { value: 'FR', label: '\u{1F1EB}\u{1F1F7} Fransa' },
  { value: 'IT', label: '\u{1F1EE}\u{1F1F9} İtalya' },
  { value: 'ES', label: '\u{1F1EA}\u{1F1F8} İspanya' },
  { value: 'NL', label: '\u{1F1F3}\u{1F1F1} Hollanda' },
  { value: 'BE', label: '\u{1F1E7}\u{1F1EA} Belcika' },
  { value: 'JP', label: '\u{1F1EF}\u{1F1F5} Japonya' },
  { value: 'KR', label: '\u{1F1F0}\u{1F1F7} Guney Kore' },
  { value: 'IN', label: '\u{1F1EE}\u{1F1F3} Hindistan' },
  { value: 'AE', label: '\u{1F1E6}\u{1F1EA} BAE' },
  { value: 'SA', label: '\u{1F1F8}\u{1F1E6} Suudi Arabistan' },
  { value: 'RU', label: '\u{1F1F7}\u{1F1FA} Rusya' },
  { value: 'BR', label: '\u{1F1E7}\u{1F1F7} Brezilya' },
  { value: 'EG', label: '\u{1F1EA}\u{1F1EC} Misir' },
  { value: 'GR', label: '\u{1F1EC}\u{1F1F7} Yunanistan' },
  { value: 'SG', label: '\u{1F1F8}\u{1F1EC} Singapur' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function QuotationForm({
  defaultValues,
  onSubmit,
  onCancel,
  onSaveDraft,
  loading = false,
  users,
  refId,
  formId = 'quotation-form',
}: QuotationFormProps) {
  const { getOptions } = useLookups();
  const serviceTypeOptions = getOptions('service_type');
  const incotermOptions = getOptions('incoterm');
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';
  const currentUserId = currentUser?.id ? Number(currentUser.id) : 0;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: defaultValues?.customerId ?? 0,
      quoteDate: defaultValues?.quoteDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      validityDate: defaultValues?.validityDate?.split('T')[0] ?? '',
      transportMode: defaultValues?.transportMode ?? '',
      serviceType: defaultValues?.serviceType ?? '',
      originCountry: defaultValues?.originCountry ?? '',
      pol: defaultValues?.pol ?? '',
      destinationCountry: defaultValues?.destinationCountry ?? '',
      pod: defaultValues?.pod ?? '',
      incoterm: defaultValues?.incoterm ?? '',
      price: defaultValues?.price ?? undefined,
      currency: defaultValues?.currency ?? 'USD',
      priceNote: defaultValues?.priceNote ?? '',
      status: defaultValues?.status ?? 'Bekliyor',
      lossReason: defaultValues?.lossReason ?? '',
      assignedUserId:
        defaultValues?.assignedUserId ?? (isAdmin ? 0 : currentUserId),
    },
  });

  const watchStatus = watch('status');
  const watchTransportMode = watch('transportMode');

  /* ---- Loss Reason: lookup'tan checkbox listesi + "Diğer" serbest text ---- */
  const lossReasonOptions = getOptions('loss_reason');
  const [selectedLossReasons, setSelectedLossReasons] = useState<string[]>([]);
  const [otherLossText, setOtherLossText] = useState('');

  // Mevcut lossReason CSV string'ini ilk render'da parse et: bilinen değerler
  // checkbox'lara, "Diğer: <metin>" varsa textarea'ya yansir.
  useEffect(() => {
    const raw = (defaultValues?.lossReason || '').trim();
    if (!raw) {
      setSelectedLossReasons([]);
      setOtherLossText('');
      return;
    }
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    const known: string[] = [];
    let other = '';
    const knownValues = lossReasonOptions.map((o) => o.value);
    for (const p of parts) {
      if (/^Diğer\s*:/i.test(p)) {
        other = p.replace(/^Diğer\s*:\s*/i, '').trim();
        if (!known.includes('Diğer')) known.push('Diğer');
      } else if (knownValues.includes(p)) {
        if (!known.includes(p)) known.push(p);
      } else {
        // Bilinmeyen serbest deger -> Diğer text'ine ekle
        other = other ? `${other}; ${p}` : p;
        if (!known.includes('Diğer')) known.push('Diğer');
      }
    }
    setSelectedLossReasons(known);
    setOtherLossText(other);
  }, [defaultValues, lossReasonOptions]);

  function toggleLossReason(value: string) {
    setSelectedLossReasons((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function buildLossReasonCsv(): string {
    if (selectedLossReasons.length === 0) return '';
    return selectedLossReasons
      .map((r) =>
        r === 'Diğer' && otherLossText.trim()
          ? `Diğer: ${otherLossText.trim()}`
          : r,
      )
      .join(', ');
  }

  /* ---- Customer search ---- */
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Pick<Customer, 'id' | 'companyName' | 'contactName' | 'phone'> | null>(
    defaultValues?.customer
      ? { id: defaultValues.customer.id, companyName: defaultValues.customer.companyName, contactName: null, phone: '' }
      : null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(customerSearch, 300);

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const result = await customerService.getAll(1, 10, { search: query });
      setCustomerResults(result.data);
    } catch {
      setCustomerResults([]);
    }
  }, []);

  useEffect(() => {
    searchCustomers(debouncedSearch);
  }, [debouncedSearch, searchCustomers]);

  function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    setCustomerSearch('');
    setShowDropdown(false);
    setCustomerResults([]);
  }

  /* ---- Render ---- */

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) => {
        // Kaybedildi degilse loss reason'i temizle; aksi halde checkbox+textarea
        // birlesimi CSV olarak yaz.
        const finalLoss =
          data.status === 'Kaybedildi' ? buildLossReasonCsv() : '';
        onSubmit({ ...data, lossReason: finalLoss });
      })}
    >
      {/* Ref ID + Draft save link */}
      {(refId || onSaveDraft) && (
        <div className="flex items-center justify-between mb-4">
          {refId && (
            <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
              REF ID: {refId}
            </span>
          )}
          {onSaveDraft && (
            <button
              type="button"
              onClick={() => onSaveDraft(watch())}
              className="text-sm text-primary hover:underline font-medium"
            >
              Taslak Olarak Kaydet
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT: Yuk Bilgileri ===== */}
        <Card title="Yuk Bilgileri">
          <div className="space-y-5">
            {/* Bagli Müşteri */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Bagli Müşteri
              </label>
              <div className="relative">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedCustomer.companyName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {selectedCustomer.companyName}
                        </p>
                        {selectedCustomer.contactName && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.contactName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setValue('customerId', 0);
                      }}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 p-1"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Input
                      icon="search"
                      placeholder="Müşteri adı ile arama..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      error={errors.customerId?.message}
                    />
                    {showDropdown && customerResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60 text-left border-b border-slate-50 last:border-0"
                          >
                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                              {c.companyName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                                {c.companyName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {c.contactName || c.phone}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dates side by side */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Teklif Tarihi"
                error={errors.quoteDate?.message}
                {...register('quoteDate')}
              />
              <DatePicker
                label="Geçerlilik Tarihi"
                error={errors.validityDate?.message}
                {...register('validityDate')}
              />
            </div>

            {/* Transport Mode button group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Taşıma Modu
              </label>
              <div className="flex gap-2">
                {TRANSPORT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setValue('transportMode', mode.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm flex-1 justify-center',
                      watchTransportMode === mode.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300',
                    )}
                  >
                    <Icon name={mode.icon} size="sm" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Type */}
            <Select
              label="Servis Tipi"
              options={serviceTypeOptions}
              placeholder="Servis tipi seçin"
              {...register('serviceType')}
            />

            {/* Origin */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Çıkış Noktasi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Ülke"
                  options={COUNTRY_OPTIONS}
                  placeholder="Ülke seçin"
                  {...register('originCountry')}
                />
                <Input
                  label="Yukleme Noktasi (POL)"
                  placeholder="Liman / Sehir"
                  {...register('pol')}
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Varış Noktasi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Ülke"
                  options={COUNTRY_OPTIONS}
                  placeholder="Ülke seçin"
                  {...register('destinationCountry')}
                />
                <Input
                  label="Varış Noktasi (POD)"
                  placeholder="Liman / Sehir"
                  {...register('pod')}
                />
              </div>
            </div>

            {/* Incoterms */}
            <Select
              label="Incoterms"
              options={incotermOptions}
              placeholder="Incoterm seçin"
              {...register('incoterm')}
            />
          </div>
        </Card>

        {/* ===== RIGHT: Fiyat ve Durum ===== */}
        <Card title="Fiyat ve Durum">
          <div className="space-y-5">
            {/* Price + Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Teklif Tutari
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 px-4 text-2xl font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
                <div className="w-32">
                  <select
                    className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 px-4 font-bold appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    {...register('currency')}
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.price && (
                <p className="mt-1.5 text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            {/* Price Note */}
            <Textarea
              label="Fiyat Notu"
              placeholder="Fiyat ile ilgili aciklama ekleyin..."
              rows={4}
              {...register('priceNote')}
            />

            {/* Status */}
            <Select
              label="Sonuc"
              options={STATUS_OPTIONS}
              placeholder="Durum seçin"
              {...register('status')}
            />

            {/* Loss Reason - only when Kaybedildi */}
            {watchStatus === 'Kaybedildi' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Kaybedilme Nedeni
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Bir veya birden fazla neden seçebilirsin. "Diğer" işaretlersen
                  altta açıklama alanı çıkar.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                  {lossReasonOptions.map((o) => {
                    const checked = selectedLossReasons.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-sm transition-colors',
                          checked
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLossReason(o.value)}
                          className="size-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40 dark:border-slate-600"
                        />
                        <span>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedLossReasons.includes('Diğer') && (
                  <div className="mt-3">
                    <Textarea
                      label="Detay (Diğer)"
                      placeholder="Lütfen kaybetme detayını açıklayın..."
                      rows={2}
                      value={otherLossText}
                      onChange={(e) => setOtherLossText(e.target.value)}
                    />
                  </div>
                )}
                {/* Hidden field — submit'te buildLossReasonCsv() set ediliyor */}
                <input type="hidden" {...register('lossReason')} />
              </div>
            )}

            {/* Assigned User */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Atanan Temsilci
              </label>
              {isAdmin ? (
                <Controller
                  name="assignedUserId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <select
                        className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 px-4 appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : 0)
                        }
                      >
                        <option value="" disabled>
                          Temsilci seçin
                        </option>
                        {users.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                      {field.value > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar
                            name={users.find((u) => u.value === field.value.toString())?.label}
                            size="sm"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {users.find((u) => u.value === field.value.toString())?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <Icon name="lock" size="sm" className="text-slate-400 dark:text-slate-500" />
                  <Avatar
                    name={defaultValues?.assignedUser?.fullName ?? currentUser?.fullName ?? '-'}
                    size="sm"
                  />
                  <span className="font-medium">
                    {defaultValues?.assignedUser?.fullName ?? currentUser?.fullName ?? '-'}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                    Yalnizca yöneticiler degistirebilir
                  </span>
                </div>
              )}
              {errors.assignedUserId && (
                <p className="mt-1.5 text-sm text-red-500">{errors.assignedUserId.message}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" icon="save" loading={loading}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
