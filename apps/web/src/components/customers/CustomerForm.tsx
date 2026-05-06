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
import { useAuthStore } from '@/stores/authStore';
import type { Customer, CustomerCreateInput } from '@nakliye-crm/shared';
import { splitMultiValue, formatTrPhone, normalizeTrPhone } from '@nakliye-crm/shared';
import { smartTitleCase } from '@/utils/smart-title-case';

function toFieldArray(input?: string | null): { value: string }[] {
  if (!input) return [{ value: '' }];
  const parts = splitMultiValue(input);
  return parts.length > 0 ? parts.map((value) => ({ value })) : [{ value: '' }];
}

// Extended form schema to handle multiple phones/emails
const customerFormSchema = z.object({
  companyName: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır'),
  contactName: z.string().optional(),
  taxNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim().length === 0 || /^[0-9]{10,11}$/.test(v.trim()),
      'Vergi numarası 10 (kurumsal VKN) ya da 11 (TCKN) hane olmalı',
    ),
  taxOffice: z.string().max(80, 'Vergi dairesi en fazla 80 karakter').optional(),
  phones: z
    .array(
      z.object({
        value: z
          .string()
          .refine(
            (v) => v.trim().length === 0 || v.replace(/[\s\-()]/g, '').length >= 10,
            'Geçerli bir telefon numarasi giriniz',
          ),
      }),
    )
    .min(1)
    .refine(
      (arr) => arr.some((p) => p.value.trim().length > 0),
      { message: 'En az bir telefon numarasi giriniz', path: ['0', 'value'] },
    ),
  emails: z
    .array(
      z.object({
        value: z
          .string()
          .refine(
            (v) => v.trim().length === 0 || z.string().email().safeParse(v.trim()).success,
            'Geçerli bir e-posta adresi giriniz',
          ),
      }),
    )
    .min(1)
    .refine(
      (arr) => arr.some((e) => e.value.trim().length > 0),
      { message: 'En az bir e-posta adresi giriniz', path: ['0', 'value'] },
    ),
  address: z.string().optional(),
  showLocationDetails: z.boolean().optional(),
  transportModes: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  incoterms: z.array(z.string()).optional(),
  direction: z.string().optional(),
  // Musteri formunda artik tek liste: "Ilgilendigi Ulkeler". Submit'te
  // backend'e originCountries ve destinationCountries ikisine de ayni array
  // yazilarak geriye uyumluluk korunur (bkz. handleFormSubmit).
  interestCountries: z.array(z.string()).optional(),
  source: z.string().optional(),
  potential: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  assignedUserId: z.number({ invalid_type_error: 'Temsilci seçimi zorunludur' }).int().positive('Temsilci seçimi zorunludur'),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: CustomerCreateInput) => void;
  onCancel: () => void;
  loading?: boolean;
  conflictWarning?: string | null;
  users: { value: string; label: string }[];
  formId?: string;
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
  formId = 'customer-form',
}: CustomerFormProps) {
  const { getOptions } = useLookups();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';

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
      taxNumber: initialData?.taxNumber || '',
      taxOffice: initialData?.taxOffice || '',
      phones: toFieldArray(initialData?.phone),
      emails: toFieldArray(initialData?.email),
      address: initialData?.address || '',
      showLocationDetails: false,
      transportModes: initialData?.transportModes || [],
      serviceTypes: initialData?.serviceTypes || [],
      incoterms: initialData?.incoterms || [],
      direction: initialData?.direction || '',
      // Edit modunda mevcut iki listeyi birlestir (dedupe)
      interestCountries: Array.from(
        new Set([
          ...(initialData?.originCountries ?? []),
          ...(initialData?.destinationCountries ?? []),
        ]),
      ),
      source: initialData?.source || '',
      potential: initialData?.potential || '',
      status: initialData?.status || 'Aktif',
      notes: initialData?.notes || '',
      assignedUserId:
        initialData?.assignedUserId ??
        (isAdmin
          ? (undefined as unknown as number)
          : currentUser?.id
            ? Number(currentUser.id)
            : (undefined as unknown as number)),
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
  // Triggers when companyName, phones, emails veya taxNumber 500ms sabit kaldiginda
  const watchedCompanyName = watch('companyName');
  const watchedPhones = watch('phones');
  const watchedEmails = watch('emails');
  const watchedTaxNumber = watch('taxNumber');
  const phoneKey = (watchedPhones || []).map((p) => p?.value || '').join('|');
  const emailKey = (watchedEmails || []).map((e) => e?.value || '').join('|');
  const debouncedCompanyName = useDebounce(watchedCompanyName, 500);
  const debouncedPhoneKey = useDebounce(phoneKey, 500);
  const debouncedEmailKey = useDebounce(emailKey, 500);
  const debouncedTaxNumber = useDebounce(watchedTaxNumber, 500);
  const [conflictMatches, setConflictMatches] = useState<ConflictMatch[]>([]);

  useEffect(() => {
    const hasEnoughName = (debouncedCompanyName || '').length >= 3;
    const hasPhone = debouncedPhoneKey.replace(/\|/g, '').length >= 10;
    const hasEmail = /@.+\./.test(debouncedEmailKey);
    const hasTax = !!debouncedTaxNumber && /^[0-9]{10,11}$/.test(debouncedTaxNumber.trim());
    if (!hasEnoughName && !hasPhone && !hasEmail && !hasTax) {
      setConflictMatches([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const phones = (watchedPhones || []).map((p) => p?.value || '').filter(Boolean).join(', ');
        const emails = (watchedEmails || []).map((e) => e?.value || '').filter(Boolean).join(', ');
        const matches = await customerService.conflictCheck(
          phones,
          emails,
          debouncedCompanyName,
          debouncedTaxNumber?.trim() || undefined,
        );
        // Düzenleme ise mevcut kaydı hariç tut
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
  }, [debouncedCompanyName, debouncedPhoneKey, debouncedEmailKey, debouncedTaxNumber]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // "Ilgilendigi Ulkeler" tek listesi backend'de iki ayri field'a yazilir.
    // Boylece teklif/sevkiyat tarafindaki kosis-varis ayrimi korunsun ve
    // mevcut filtreler bozulmasin (musteri kaydinda anlamli ayrim yok zaten).
    const interest = data.interestCountries ?? [];
    const submitData: CustomerCreateInput = {
      companyName: data.companyName,
      contactName: data.contactName,
      taxNumber: data.taxNumber?.trim() || undefined,
      taxOffice: data.taxOffice?.trim() || undefined,
      phone: data.phones.map((p) => p.value).filter(Boolean).join(', '),
      email: data.emails.map((e) => e.value).filter(Boolean).join(', '),
      address: data.address,
      transportModes: data.transportModes,
      serviceTypes: data.serviceTypes,
      incoterms: data.incoterms,
      direction: data.direction,
      originCountries: interest,
      destinationCountries: interest,
      source: data.source,
      potential: data.potential,
      status: data.status,
      notes: data.notes,
      assignedUserId: data.assignedUserId,
    };
    onSubmit(submitData);
  }

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
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
            {/* Firma Adı + akilli buyuk/kucuk harf duzeltici */}
            <div className="relative">
              <Input
                label="Firma Adı"
                placeholder="Firma adını giriniz"
                icon="business"
                error={errors.companyName?.message}
                {...register('companyName')}
              />
              <button
                type="button"
                onClick={() => {
                  const current = watch('companyName') || '';
                  const fixed = smartTitleCase(current);
                  if (fixed !== current) {
                    setValue('companyName', fixed, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                title="Otomatik büyük/küçük harf düzelt (MSC, A.Ş. gibi kısaltmalar korunur)"
                aria-label="Otomatik büyük/küçük harf düzelt"
                className="absolute right-2 top-[34px] inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name="match_case" size="sm" className="!text-[14px]" />
                Aa
              </button>
            </div>

            {/* Conflict suggestions */}
            {conflictMatches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 -mt-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Olası mükerrer:
                </span>
                {conflictMatches.map((match) => {
                  const isDef = match.severity === 'definite';
                  const typeLabel =
                    match.matchType === 'tax_number'
                      ? 'Vergi No'
                      : match.matchType === 'phone'
                        ? 'Telefon'
                        : match.matchType === 'email'
                          ? 'E-posta'
                          : match.matchType === 'email_domain'
                            ? 'Aynı kurumsal e-posta'
                            : 'Firma adı';
                  return (
                    <span
                      key={`${match.customerId}-${match.matchType}`}
                      title={`${typeLabel} eşleşmesi${match.matchedOn ? ' — ' + match.matchedOn : ''}`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDef
                          ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30'
                          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      <Icon
                        name={isDef ? 'block' : 'warning'}
                        size="sm"
                        className={`${isDef ? 'text-red-500 dark:text-red-300' : 'text-amber-500 dark:text-amber-300'} !text-[14px]`}
                      />
                      {match.companyName} (%{Math.round(match.similarity)})
                    </span>
                  );
                })}
              </div>
            )}

            {/* Yetkili Adı */}
            <Input
              label="Yetkili Adı"
              placeholder="Yetkili kisi adını giriniz"
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
                    <Controller
                      control={control}
                      name={`phones.${index}.value`}
                      render={({ field: phoneField }) => (
                        <Input
                          placeholder="+90 (5XX) XXX XX XX"
                          icon="phone"
                          error={errors.phones?.[index]?.value?.message}
                          value={phoneField.value || ''}
                          onChange={(e) => phoneField.onChange(e.target.value)}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            // Tam 10 haneli normalize edilebilir bir TR numarasi ise formatla
                            if (normalizeTrPhone(raw)) {
                              phoneField.onChange(formatTrPhone(raw));
                            }
                            phoneField.onBlur();
                          }}
                        />
                      )}
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
                      placeholder="örnek@firma.com"
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

            {/* Vergi Bilgileri — adres ile birlikte gruplanir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Vergi No / TCKN"
                placeholder="10 veya 11 haneli"
                icon="badge"
                error={errors.taxNumber?.message}
                inputMode="numeric"
                maxLength={11}
                {...register('taxNumber')}
              />
              <Input
                label="Vergi Dairesi"
                placeholder="Örn. Beşiktaş V.D."
                icon="account_balance"
                error={errors.taxOffice?.message}
                {...register('taxOffice')}
              />
            </div>

            <Controller
              control={control}
              name="showLocationDetails"
              render={({ field }) => (
                <Checkbox
                  label="Konum detaylarini göster"
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
            {/* Taşıma Modu - Button Group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Taşıma Modu
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

            {/* İlgilendiği Ülkeler — müşterinin hattan/yöne ayrılmaksızın
                ilgilendiği tüm ülkeler */}
            <Controller
              control={control}
              name="interestCountries"
              render={({ field }) => (
                <MultiSelect
                  label="İlgilendiği Ülkeler"
                  options={countryOptions}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="İlgilenilen ülkeleri seçiniz"
                />
              )}
            />

            {/* Müşteri Kaynagi */}
            <Select
              label="Müşteri Kaynagi"
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

            {/* Müşteri Durumu */}
            <Select
              label="Müşteri Durumu"
              options={statusOptions}
              placeholder="Durum seciniz"
              error={errors.status?.message}
              {...register('status')}
            />

            {/* Atanan Temsilci */}
            {isAdmin ? (
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Atanan Temsilci
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <Icon name="lock" size="sm" className="text-slate-400 dark:text-slate-500" />
                  <span className="font-medium">
                    {initialData?.assignedUser?.fullName ?? currentUser?.fullName ?? '-'}
                  </span>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                    Yalnizca yöneticiler degistirebilir
                  </span>
                </div>
              </div>
            )}

            {/* Notlar */}
            <Textarea
              label="Notlar"
              placeholder="Müşteri hakkinda ek notlar..."
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="mt-6 flex items-center justify-end gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" icon="save" loading={loading}>
          Müşteriyi Kaydet
        </Button>
      </div>
    </form>
  );
}
