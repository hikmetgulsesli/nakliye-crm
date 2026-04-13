import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, DatePicker, Textarea, Button, Card, Icon } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { useLookups } from '@/hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { customerService } from '@/services/customer.service';
import { cn } from '@/utils/cn';
import type { Customer, Quotation } from '@nakliye-crm/shared';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const quotationSchema = z.object({
  customerId: z.number({ required_error: 'Musteri secimi zorunludur' }).min(1, 'Musteri secimi zorunludur'),
  quoteDate: z.string().min(1, 'Teklif tarihi zorunludur'),
  validityDate: z.string().min(1, 'Gecerlilik tarihi zorunludur'),
  transportMode: z.string().optional(),
  serviceType: z.string().optional(),
  originCountry: z.string().optional(),
  pol: z.string().optional(),
  destinationCountry: z.string().optional(),
  pod: z.string().optional(),
  incoterm: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  priceNote: z.string().optional(),
  status: z.string().optional(),
  lossReason: z.string().optional(),
  assignedUserId: z.number({ required_error: 'Temsilci secimi zorunludur' }).min(1, 'Temsilci secimi zorunludur'),
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
  { value: 'Kazanildi', label: 'Kazanildi' },
  { value: 'Kaybedildi', label: 'Kaybedildi' },
];

const COUNTRY_OPTIONS = [
  { value: 'TR', label: '\u{1F1F9}\u{1F1F7} Turkiye' },
  { value: 'CN', label: '\u{1F1E8}\u{1F1F3} Cin' },
  { value: 'US', label: '\u{1F1FA}\u{1F1F8} ABD' },
  { value: 'DE', label: '\u{1F1E9}\u{1F1EA} Almanya' },
  { value: 'GB', label: '\u{1F1EC}\u{1F1E7} Ingiltere' },
  { value: 'FR', label: '\u{1F1EB}\u{1F1F7} Fransa' },
  { value: 'IT', label: '\u{1F1EE}\u{1F1F9} Italya' },
  { value: 'ES', label: '\u{1F1EA}\u{1F1F8} Ispanya' },
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
}: QuotationFormProps) {
  const { getOptions } = useLookups();
  const serviceTypeOptions = getOptions('service_type');
  const incotermOptions = getOptions('incoterm');

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
      assignedUserId: defaultValues?.assignedUserId ?? 0,
    },
  });

  const watchStatus = watch('status');
  const watchTransportMode = watch('transportMode');

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
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Ref ID + Draft save link */}
      {(refId || onSaveDraft) && (
        <div className="flex items-center justify-between mb-4">
          {refId && (
            <span className="text-sm text-slate-400 font-mono">
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
            {/* Bagli Musteri */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Bagli Musteri
              </label>
              <div className="relative">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {selectedCustomer.companyName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {selectedCustomer.companyName}
                        </p>
                        {selectedCustomer.contactName && (
                          <p className="text-xs text-slate-500">{selectedCustomer.contactName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setValue('customerId', 0);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Input
                      icon="search"
                      placeholder="Musteri adi ile arama..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      error={errors.customerId?.message}
                    />
                    {showDropdown && customerResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                          >
                            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                              {c.companyName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">
                                {c.companyName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
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
                label="Gecerlilik Tarihi"
                error={errors.validityDate?.message}
                {...register('validityDate')}
              />
            </div>

            {/* Transport Mode button group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tasima Modu
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
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
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
              placeholder="Servis tipi secin"
              {...register('serviceType')}
            />

            {/* Origin */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Cikis Noktasi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Ulke"
                  options={COUNTRY_OPTIONS}
                  placeholder="Ulke secin"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Varis Noktasi
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Ulke"
                  options={COUNTRY_OPTIONS}
                  placeholder="Ulke secin"
                  {...register('destinationCountry')}
                />
                <Input
                  label="Varis Noktasi (POD)"
                  placeholder="Liman / Sehir"
                  {...register('pod')}
                />
              </div>
            </div>

            {/* Incoterms */}
            <Select
              label="Incoterms"
              options={incotermOptions}
              placeholder="Incoterm secin"
              {...register('incoterm')}
            />
          </div>
        </Card>

        {/* ===== RIGHT: Fiyat ve Durum ===== */}
        <Card title="Fiyat ve Durum">
          <div className="space-y-5">
            {/* Price + Currency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                        className="w-full h-14 bg-white border border-slate-200 rounded-xl text-slate-900 px-4 text-2xl font-bold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
                <div className="w-32">
                  <select
                    className="w-full h-14 bg-white border border-slate-200 rounded-xl text-slate-900 px-4 font-bold appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
              placeholder="Durum secin"
              {...register('status')}
            />

            {/* Loss Reason - only when Kaybedildi */}
            {watchStatus === 'Kaybedildi' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Textarea
                  label="Kaybedilme Nedeni"
                  placeholder="Teklifi kaybetme nedeninizi aciklayiniz..."
                  rows={3}
                  {...register('lossReason')}
                />
              </div>
            )}

            {/* Assigned User */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Atanan Temsilci
              </label>
              <Controller
                name="assignedUserId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <select
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl text-slate-900 px-4 appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                    >
                      <option value="" disabled>
                        Temsilci secin
                      </option>
                      {users.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    {/* Avatar preview */}
                    {field.value > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar
                          name={users.find((u) => u.value === field.value.toString())?.label}
                          size="sm"
                        />
                        <span className="text-sm text-slate-700 font-medium">
                          {users.find((u) => u.value === field.value.toString())?.label}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              />
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
          Iptal
        </Button>
        <Button type="submit" icon="save" loading={loading}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
