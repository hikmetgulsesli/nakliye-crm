import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button, Textarea, Checkbox, MultiSelect } from '@/components/ui';
import { Icon } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useLookups } from '@/hooks/useLookups';
import { useDebounce } from '@/hooks/useDebounce';
import { customerService, type ConflictMatch } from '@/services/customer.service';
import type { Customer, CustomerCreateInput } from '@nakliye-crm/shared';

// Extended form schema to handle multiple phones/emails
const customerFormSchema = z.object({
  companyName: z.string().min(2, 'Firma adi en az 2 karakter olmalidir'),
  contactName: z.string().optional(),
  phones: z.array(z.object({ value: z.string() })).min(1),
  emails: z.array(z.object({ value: z.string() })).min(1),
  address: z.string().optional(),
  showLocationDetails: z.boolean().optional(),
  transportModes: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  incoterms: z.array(z.string()).optional(),
  direction: z.string().optional(),
  originCountries: z.array(z.string()).optional(),
  destinationCountries: z.array(z.string()).optional(),
  source: z.string().optional(),
  potential: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  assignedUserId: z.number({ invalid_type_error: 'Temsilci secimi zorunludur' }).int().positive('Temsilci secimi zorunludur'),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: CustomerCreateInput) => void;
  onCancel: () => void;
  loading?: boolean;
  conflictWarning?: string | null;
  users: { value: string; label: string }[];
}

const TRANSPORT_MODES = [
  { key: 'Deniz', icon: 'directions_boat' },
  { key: 'Hava', icon: 'flight' },
  { key: 'Kara', icon: 'local_shipping' },
  { key: 'Kombine', icon: 'hub' },
];

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  conflictWarning,
  users,
}: CustomerFormProps) {
  const { getOptions } = useLookups();

  const serviceTypeOptions = getOptions('service_type');
  const incotermOptions = getOptions('incoterm');
  const countryOptions = getOptions('country');
  const sourceOptions = getOptions('customer_source');
  const potentialOptions = getOptions('potential_level');
  const statusOptions = getOptions('customer_status');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      companyName: initialData?.companyName || '',
      contactName: initialData?.contactName || '',
      phones: initialData?.phone
        ? [{ value: initialData.phone }]
        : [{ value: '' }],
      emails: initialData?.email
        ? [{ value: initialData.email }]
        : [{ value: '' }],
      address: initialData?.address || '',
      showLocationDetails: false,
      transportModes: initialData?.transportModes || [],
      serviceTypes: initialData?.serviceTypes || [],
      incoterms: initialData?.incoterms || [],
      direction: initialData?.direction || '',
      originCountries: initialData?.originCountries || [],
      destinationCountries: initialData?.destinationCountries || [],
      source: initialData?.source || '',
      potential: initialData?.potential || '',
      status: initialData?.status || 'Aktif',
      notes: initialData?.notes || '',
      assignedUserId: initialData?.assignedUserId || (undefined as unknown as number),
    },
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({ control, name: 'phones' });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({ control, name: 'emails' });

  const selectedTransportModes = watch('transportModes') || [];

  // --- Real-time conflict detection ---
  // Triggers when companyName, phones veya emails 500ms sabit kaldiginda
  const watchedCompanyName = watch('companyName');
  const watchedPhones = watch('phones');
  const watchedEmails = watch('emails');
  const phoneKey = (watchedPhones || []).map((p) => p?.value || '').join('|');
  const emailKey = (watchedEmails || []).map((e) => e?.value || '').join('|');
  const debouncedCompanyName = useDebounce(watchedCompanyName, 500);
  const debouncedPhoneKey = useDebounce(phoneKey, 500);
  const debouncedEmailKey = useDebounce(emailKey, 500);
  const [conflictMatches, setConflictMatches] = useState<ConflictMatch[]>([]);

  useEffect(() => {
    const hasEnoughName = (debouncedCompanyName || '').length >= 3;
    const hasPhone = debouncedPhoneKey.replace(/\|/g, '').length >= 10;
    const hasEmail = /@.+\./.test(debouncedEmailKey);
    if (!hasEnoughName && !hasPhone && !hasEmail) {
      setConflictMatches([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const phones = (watchedPhones || []).map((p) => p?.value || '').filter(Boolean).join(', ');
        const emails = (watchedEmails || []).map((e) => e?.value || '').filter(Boolean).join(', ');
        const matches = await customerService.conflictCheck(phones, emails, debouncedCompanyName);
        // Duzenleme ise mevcut kaydi hariç tut
        const filtered = initialData?.id
          ? matches.filter((m) => m.customerId !== initialData.id)
          : matches;
        if (!cancelled) setConflictMatches(filtered);
      } catch {
        // sessizce yut
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCompanyName, debouncedPhoneKey, debouncedEmailKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTransportMode(mode: string) {
    const current = selectedTransportModes;
    if (current.includes(mode)) {
      setValue(
        'transportModes',
        current.filter((m) => m !== mode),
      );
    } else {
      setValue('transportModes', [...current, mode]);
    }
  }

  function handleFormSubmit(data: CustomerFormData) {
    const submitData: CustomerCreateInput = {
      companyName: data.companyName,
      contactName: data.contactName,
      phone: data.phones.map((p) => p.value).filter(Boolean).join(', '),
      email: data.emails.map((e) => e.value).filter(Boolean).join(', '),
      address: data.address,
      transportModes: data.transportModes,
      serviceTypes: data.serviceTypes,
      incoterms: data.incoterms,
      direction: data.direction,
      originCountries: data.originCountries,
      destinationCountries: data.destinationCountries,
      source: data.source,
      potential: data.potential,
      status: data.status,
      notes: data.notes,
      assignedUserId: data.assignedUserId,
    };
    onSubmit(submitData);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Conflict warning banner */}
      {conflictWarning && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 dark:bg-amber-500/10 dark:border-amber-500/30">
          <Icon name="warning" className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{conflictWarning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Temel Bilgiler */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
            Temel Bilgiler
          </h2>

          <div className="space-y-4">
            {/* Firma Adi */}
            <Input
              label="Firma Adi"
              placeholder="Firma adini giriniz"
              icon="business"
              error={errors.companyName?.message}
              {...register('companyName')}
            />

            {/* Conflict suggestions */}
            {conflictMatches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 -mt-2">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Benzer kayitlar:
                </span>
                {conflictMatches.map((match) => (
                  <span
                    key={match.customerId}
                    title={`${match.matchType === 'phone' ? 'Telefon' : match.matchType === 'email' ? 'E-posta' : 'Firma adi'} eslesmesi`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30"
                  >
                    <Icon name="warning" size="sm" className="text-amber-500 dark:text-amber-300 !text-[14px]" />
                    {match.companyName} (%{Math.round(match.similarity)})
                  </span>
                ))}
              </div>
            )}

            {/* Yetkili Adi */}
            <Input
              label="Yetkili Adi"
              placeholder="Yetkili kisi adini giriniz"
              icon="person"
              error={errors.contactName?.message}
              {...register('contactName')}
            />

            {/* Telefonlar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Telefon
              </label>
              {phoneFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <Input
                      placeholder="+90 5XX XXX XX XX"
                      icon="phone"
                      error={errors.phones?.[index]?.value?.message}
                      {...register(`phones.${index}.value`)}
                    />
                  </div>
                  {phoneFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors p-2"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendPhone({ value: '' })}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-blue-700 transition-colors mt-1"
              >
                <Icon name="add" size="sm" />
                Telefon Ekle
              </button>
            </div>

            {/* E-postalar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                E-posta
              </label>
              {emailFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <Input
                      placeholder="ornek@firma.com"
                      icon="mail"
                      error={errors.emails?.[index]?.value?.message}
                      {...register(`emails.${index}.value`)}
                    />
                  </div>
                  {emailFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors p-2"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendEmail({ value: '' })}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-blue-700 transition-colors mt-1"
              >
                <Icon name="add" size="sm" />
                E-posta Ekle
              </button>
            </div>

            {/* Adres */}
            <Textarea
              label="Adres"
              placeholder="Adres bilgisini giriniz"
              error={errors.address?.message}
              {...register('address')}
            />

            <Controller
              control={control}
              name="showLocationDetails"
              render={({ field }) => (
                <Checkbox
                  label="Konum detaylarini goster"
                  checked={field.value || false}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Right Column - Nakliye & CRM Bilgileri */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
            Nakliye & CRM Bilgileri
          </h2>

          <div className="space-y-5">
            {/* Tasima Modu - Button Group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tasima Modu
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_MODES.map((mode) => {
                  const isActive = selectedTransportModes.includes(mode.key);
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => toggleTransportMode(mode.key)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:text-primary',
                      )}
                    >
                      <Icon name={mode.icon} size="sm" />
                      {mode.key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Servis Tipi */}
            <Controller
              control={control}
              name="serviceTypes"
              render={({ field }) => (
                <MultiSelect
                  label="Servis Tipi"
                  options={serviceTypeOptions}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Servis tiplerini seciniz"
                />
              )}
            />

            {/* Incoterms - Pill selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Incoterms
              </label>
              <Controller
                control={control}
                name="incoterms"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {incotermOptions.map((opt) => {
                      const isSelected = (field.value || []).includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const current = field.value || [];
                            if (isSelected) {
                              field.onChange(current.filter((v: string) => v !== opt.value));
                            } else {
                              field.onChange([...current, opt.value]);
                            }
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                            isSelected
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary/30',
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Cikis Ulkeleri */}
            <Controller
              control={control}
              name="originCountries"
              render={({ field }) => (
                <MultiSelect
                  label="Cikis Ulkeleri"
                  options={countryOptions}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Cikis ulkelerini seciniz"
                />
              )}
            />

            {/* Varis Ulkeleri */}
            <Controller
              control={control}
              name="destinationCountries"
              render={({ field }) => (
                <MultiSelect
                  label="Varis Ulkeleri"
                  options={countryOptions}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Varis ulkelerini seciniz"
                />
              )}
            />

            {/* Musteri Kaynagi */}
            <Select
              label="Musteri Kaynagi"
              options={sourceOptions}
              placeholder="Kaynak seciniz"
              error={errors.source?.message}
              {...register('source')}
            />

            {/* Potansiyel Durumu */}
            <Select
              label="Potansiyel Durumu"
              options={potentialOptions}
              placeholder="Potansiyel seciniz"
              error={errors.potential?.message}
              {...register('potential')}
            />

            {/* Musteri Durumu */}
            <Select
              label="Musteri Durumu"
              options={statusOptions}
              placeholder="Durum seciniz"
              error={errors.status?.message}
              {...register('status')}
            />

            {/* Atanan Temsilci */}
            <Select
              label="Atanan Temsilci"
              options={users}
              placeholder="Temsilci seciniz"
              error={errors.assignedUserId?.message}
              value={watch('assignedUserId')?.toString() || ''}
              onChange={(e) =>
                setValue('assignedUserId', Number(e.target.value), {
                  shouldValidate: true,
                })
              }
            />

            {/* Notlar */}
            <Textarea
              label="Notlar"
              placeholder="Musteri hakkinda ek notlar..."
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="mt-6 flex items-center justify-end gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Iptal
        </Button>
        <Button type="submit" icon="save" loading={loading}>
          Musteriyi Kaydet
        </Button>
      </div>
    </form>
  );
}
