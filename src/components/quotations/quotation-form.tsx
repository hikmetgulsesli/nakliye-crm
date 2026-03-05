'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuotationWithRelations, User, Customer } from '@/types';
import type { CreateQuotationInput, UpdateQuotationInput } from '@/types/quotations';

interface QuotationFormData {
  customer_id: string;
  quote_date: string;
  validity_date: string;
  transport_mode: string;
  service_type: string;
  origin_country: string;
  destination_country: string;
  pol: string;
  pod: string;
  incoterm: string;
  price: string;
  currency: 'USD' | 'EUR' | 'TRY' | '';
  price_note: string;
  status: 'Bekliyor' | 'Kazanildi' | 'Kaybedildi';
  loss_reason: 'Fiyat' | 'Rakip' | 'Gecikmeli donus' | 'Diger' | '';
  assigned_user_id: string;
}

const quotationSchema = z.object({
  customer_id: z.string().min(1, 'Müşteri seçiniz'),
  quote_date: z.string().min(1, 'Teklif tarihi zorunludur'),
  validity_date: z.string().min(1, 'Geçerlilik tarihi zorunludur'),
  transport_mode: z.string().min(1, 'Taşıma modu seçiniz'),
  service_type: z.string().min(1, 'Servis tipi seçiniz'),
  origin_country: z.string().min(1, 'Çıkış ülkesi seçiniz'),
  destination_country: z.string().min(1, 'Varış ülkesi seçiniz'),
  pol: z.string().optional(),
  pod: z.string().optional(),
  incoterm: z.string().min(1, 'Satış şekli seçiniz'),
  price: z.string().optional(),
  currency: z.string().optional(),
  price_note: z.string().optional(),
  status: z.enum(['Bekliyor', 'Kazanildi', 'Kaybedildi']),
  loss_reason: z.string().optional(),
  assigned_user_id: z.string().min(1, 'Temsilci seçiniz'),
}).refine((data) => {
  if (data.status === 'Kaybedildi') {
    return !!data.loss_reason;
  }
  return true;
}, {
  message: 'Kaybedilme nedeni zorunludur',
  path: ['loss_reason'],
});

const TRANSPORT_MODES = [
  { value: 'Deniz', label: 'Deniz' },
  { value: 'Hava', label: 'Hava' },
  { value: 'Kara', label: 'Kara' },
  { value: 'Kombine', label: 'Kombine' },
];

const SERVICE_TYPES = [
  { value: 'FCL', label: 'FCL' },
  { value: 'LCL', label: 'LCL' },
  { value: 'Parsiyel', label: 'Parsiyel' },
  { value: 'Komple', label: 'Komple' },
  { value: 'Bulk', label: 'Bulk' },
  { value: 'RoRo', label: 'RoRo' },
];

const INCOTERMS = [
  { value: 'FOB', label: 'FOB' },
  { value: 'EXW', label: 'EXW' },
  { value: 'FCA', label: 'FCA' },
  { value: 'DAP', label: 'DAP' },
  { value: 'CIF', label: 'CIF' },
  { value: 'CFR', label: 'CFR' },
  { value: 'DDP', label: 'DDP' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'TRY', label: 'TRY' },
];

const LOSS_REASONS = [
  { value: 'Fiyat', label: 'Fiyat' },
  { value: 'Rakip', label: 'Rakip' },
  { value: 'Gecikmeli donus', label: 'Gecikmeli Dönüş' },
  { value: 'Diger', label: 'Diğer' },
];

// Sample countries
const COUNTRIES = [
  { value: 'Turkiye', label: 'Türkiye' },
  { value: 'Almanya', label: 'Almanya' },
  { value: 'Ingiltere', label: 'İngiltere' },
  { value: 'Fransa', label: 'Fransa' },
  { value: 'Italya', label: 'İtalya' },
  { value: 'Ispanya', label: 'İspanya' },
  { value: 'Hollanda', label: 'Hollanda' },
  { value: 'Belcika', label: 'Belçika' },
  { value: 'ABD', label: 'ABD' },
  { value: 'Cin', label: 'Çin' },
  { value: 'Japonya', label: 'Japonya' },
  { value: 'Hindistan', label: 'Hindistan' },
  { value: 'Brezilya', label: 'Brezilya' },
  { value: 'Meksika', label: 'Meksika' },
  { value: 'Rusya', label: 'Rusya' },
];

interface QuotationFormProps {
  quotation?: QuotationWithRelations;
  customers: Customer[];
  users: User[];
  currentUser: User;
  isAdmin: boolean;
  onSubmit: (data: CreateQuotationInput | UpdateQuotationInput) => Promise<void>;
  onCancel: () => void;
}

export function QuotationForm({
  quotation,
  customers,
  users,
  currentUser,
  onSubmit,
  onCancel,
}: QuotationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);

  const isEditMode = !!quotation;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: quotation
      ? {
          customer_id: quotation.customer_id,
          quote_date: quotation.quote_date,
          validity_date: quotation.validity_date,
          transport_mode: quotation.transport_mode,
          service_type: quotation.service_type,
          origin_country: quotation.origin_country,
          destination_country: quotation.destination_country,
          pol: quotation.pol || '',
          pod: quotation.pod || '',
          incoterm: quotation.incoterm,
          price: quotation.price?.toString() || '',
          currency: quotation.currency || '',
          price_note: quotation.price_note || '',
          status: quotation.status,
          loss_reason: quotation.loss_reason || '',
          assigned_user_id: quotation.assigned_user_id,
        }
      : {
          customer_id: '',
          quote_date: new Date().toISOString().split('T')[0],
          validity_date: '',
          transport_mode: '',
          service_type: '',
          origin_country: '',
          destination_country: '',
          pol: '',
          pod: '',
          incoterm: '',
          price: '',
          currency: '',
          price_note: '',
          status: 'Bekliyor',
          loss_reason: '',
          assigned_user_id: currentUser.id,
        },
  });

  const watchedFields = watch();
  const selectedCustomer = customers.find((c) => c.id === watchedFields.customer_id);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const lowerSearch = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.company_name.toLowerCase().includes(lowerSearch) ||
          c.contact_name.toLowerCase().includes(lowerSearch)
      )
      .slice(0, 10);
  }, [customers, customerSearch]);

  const handleFormSubmit = async (data: QuotationFormData) => {
    setIsSubmitting(true);
    setFormErrors([]);

    try {
      const input: CreateQuotationInput | UpdateQuotationInput = {
        customer_id: data.customer_id,
        quote_date: data.quote_date,
        validity_date: data.validity_date,
        transport_mode: data.transport_mode,
        service_type: data.service_type,
        origin_country: data.origin_country,
        destination_country: data.destination_country,
        pol: data.pol || undefined,
        pod: data.pod || undefined,
        incoterm: data.incoterm,
        price: data.price ? parseFloat(data.price) : undefined,
        currency: data.currency || undefined,
        price_note: data.price_note || undefined,
        status: data.status,
        loss_reason: data.loss_reason || undefined,
        assigned_user_id: data.assigned_user_id,
      };

      await onSubmit(input);
    } catch (error: unknown) {
      const err = error as { message?: string; errors?: string[] };
      if (err.errors) {
        setFormErrors(err.errors);
      } else if (err.message) {
        setFormErrors([err.message]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeUsers = users.filter((u) => u.is_active);
  const showLossReason = watchedFields.status === 'Kaybedildi';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Hata</span>
          </div>
          <ul className="mt-2 list-inside list-disc text-sm text-red-700">
            {formErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Temel Bilgiler</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer_id">
              Müşteri <span className="text-red-500">*</span>
            </Label>
            {isEditMode ? (
              <Input
                value={selectedCustomer?.company_name || ''}
                disabled
                className="bg-muted"
              />
            ) : (
              <div className="relative">
                <Input
                  placeholder="Müşteri ara..."
                  value={customerSearch || selectedCustomer?.company_name || ''}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) {
                      setValue('customer_id', '');
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className={errors.customer_id ? 'border-red-500' : ''}
                />
                {showCustomerDropdown && !isEditMode && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCustomerDropdown(false)}
                    />
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white py-1 shadow-lg">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          onClick={() => {
                            setValue('customer_id', customer.id, { shouldValidate: true });
                            setCustomerSearch('');
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="font-medium">{customer.company_name}</div>
                          <div className="text-xs text-gray-500">{customer.contact_name}</div>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Müşteri bulunamadı
                        </div>
                      )}
                    </div>
                  </>
                )}
                <input type="hidden" {...register('customer_id')} />
              </div>
            )}
            {errors.customer_id && (
              <p className="text-sm text-red-500">{errors.customer_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote_date">
              Teklif Tarihi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quote_date"
              type="date"
              {...register('quote_date')}
              className={errors.quote_date ? 'border-red-500' : ''}
            />
            {errors.quote_date && (
              <p className="text-sm text-red-500">{errors.quote_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity_date">
              Geçerlilik Tarihi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="validity_date"
              type="date"
              {...register('validity_date')}
              className={errors.validity_date ? 'border-red-500' : ''}
            />
            {errors.validity_date && (
              <p className="text-sm text-red-500">{errors.validity_date.message}</p>
            )}
          </div>

          {isEditMode && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="quote_no">Teklif No</Label>
              <Input
                id="quote_no"
                value={quotation?.quote_no}
                disabled
                className="bg-muted font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Transport Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Yük Hareketi Bilgileri</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transport_mode">
              Taşıma Modu <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.transport_mode}
              onValueChange={(value) =>
                setValue('transport_mode', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.transport_mode ? 'border-red-500' : ''}>
                <SelectValue placeholder="Taşıma modu seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transport_mode && (
              <p className="text-sm text-red-500">{errors.transport_mode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">
              Servis Tipi <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.service_type}
              onValueChange={(value) =>
                setValue('service_type', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.service_type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Servis tipi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_type && (
              <p className="text-sm text-red-500">{errors.service_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin_country">
              Çıkış Ülkesi <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.origin_country}
              onValueChange={(value) =>
                setValue('origin_country', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.origin_country ? 'border-red-500' : ''}>
                <SelectValue placeholder="Çıkış ülkesi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.origin_country && (
              <p className="text-sm text-red-500">{errors.origin_country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_country">
              Varış Ülkesi <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.destination_country}
              onValueChange={(value) =>
                setValue('destination_country', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.destination_country ? 'border-red-500' : ''}>
                <SelectValue placeholder="Varış ülkesi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination_country && (
              <p className="text-sm text-red-500">{errors.destination_country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pol">Yükleme Noktası (POL)</Label>
            <Input
              id="pol"
              {...register('pol')}
              placeholder="Örn: Istanbul, Mersin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pod">Varış Noktası (POD)</Label>
            <Input
              id="pod"
              {...register('pod')}
              placeholder="Örn: Hamburg, Rotterdam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incoterm">
              Satış Şekli (Incoterm) <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.incoterm}
              onValueChange={(value) =>
                setValue('incoterm', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.incoterm ? 'border-red-500' : ''}>
                <SelectValue placeholder="Satış şekli seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {INCOTERMS.map((incoterm) => (
                  <SelectItem key={incoterm.value} value={incoterm.value}>
                    {incoterm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.incoterm && (
              <p className="text-sm text-red-500">{errors.incoterm.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Fiyat Bilgileri</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Fiyat</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register('price')}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Select
              value={watchedFields.currency}
              onValueChange={(value) =>
                setValue('currency', value as 'USD' | 'EUR' | 'TRY' | '', { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Para birimi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="price_note">Fiyat Notu</Label>
            <Input
              id="price_note"
              {...register('price_note')}
              placeholder="Fiyat ile ilgili notlar..."
            />
          </div>
        </div>
      </div>

      {/* Status & Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Durum ve Atama</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">
              Teklif Durumu <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.status}
              onValueChange={(value) =>
                setValue('status', value as 'Bekliyor' | 'Kazanildi' | 'Kaybedildi', { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Durum seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                <SelectItem value="Kazanildi">Kazanıldı</SelectItem>
                <SelectItem value="Kaybedildi">Kaybedildi</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          {showLossReason && (
            <div className="space-y-2">
              <Label htmlFor="loss_reason">
                Kaybedilme Nedeni <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedFields.loss_reason}
                onValueChange={(value) =>
                  setValue('loss_reason', value as 'Fiyat' | 'Rakip' | 'Gecikmeli donus' | 'Diger', { shouldValidate: true })
                }
              >
                <SelectTrigger className={errors.loss_reason ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Neden seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {LOSS_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.loss_reason && (
                <p className="text-sm text-red-500">{errors.loss_reason.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assigned_user_id">
              Atanan Temsilci <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFields.assigned_user_id}
              onValueChange={(value) =>
                setValue('assigned_user_id', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className={errors.assigned_user_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Temsilci seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_user_id && (
              <p className="text-sm text-red-500">{errors.assigned_user_id.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Güncelle' : 'Kaydet'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
