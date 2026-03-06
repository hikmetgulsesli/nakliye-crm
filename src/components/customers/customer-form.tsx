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
import { MultiSelect } from '@/components/ui/multi-select';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { ConflictWarning } from './conflict-warning';
import { ConflictModal } from './conflict-modal';
import type { Customer, CustomerConflict, User } from '@/types';

interface CustomerFormData {
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address?: string;
  transport_modes: string[];
  service_types: string[];
  incoterms: string[];
  direction: string[];
  origin_countries: string[];
  destination_countries: string[];
  source: 'Referans' | 'Soguk arama' | 'Fuar' | 'Dijital';
  potential: 'Dusuk' | 'Orta' | 'Yuksek';
  status: 'Aktif' | 'Pasif' | 'Soguk';
  assigned_user_id: string;
  notes?: string;
}

const customerSchema = z.object({
  company_name: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır'),
  contact_name: z.string().min(2, 'Yetkili adı en az 2 karakter olmalıdır'),
  phone: z.string().min(5, 'Geçerli bir telefon numarası giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  address: z.string().optional(),
  transport_modes: z.array(z.string()).min(1, 'En az bir taşıma modu seçiniz'),
  service_types: z.array(z.string()).min(1, 'En az bir servis tipi seçiniz'),
  incoterms: z.array(z.string()).min(1, 'En az bir satış şekli seçiniz'),
  direction: z.array(z.string()).min(1, 'En az bir işlem yönü seçiniz'),
  origin_countries: z.array(z.string()),
  destination_countries: z.array(z.string()),
  source: z.enum(['Referans', 'Soguk arama', 'Fuar', 'Dijital']),
  potential: z.enum(['Dusuk', 'Orta', 'Yuksek']),
  status: z.enum(['Aktif', 'Pasif', 'Soguk']),
  assigned_user_id: z.string().min(1, 'Temsilci seçiniz'),
  notes: z.string().optional(),
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

const DIRECTIONS = [
  { value: 'Ithalat', label: 'İthalat' },
  { value: 'Ihracat', label: 'İhracat' },
];

const SOURCES = [
  { value: 'Referans', label: 'Referans' },
  { value: 'Soguk arama', label: 'Soğuk Arama' },
  { value: 'Fuar', label: 'Fuar' },
  { value: 'Dijital', label: 'Dijital' },
];

const POTENTIALS = [
  { value: 'Dusuk', label: 'Düşük' },
  { value: 'Orta', label: 'Orta' },
  { value: 'Yuksek', label: 'Yüksek' },
];

const STATUSES = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Pasif', label: 'Pasif' },
  { value: 'Soguk', label: 'Soğuk' },
];

// Sample countries - in production, this would come from lookup_values table
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

interface CustomerFormProps {
  customer?: Customer;
  users: User[];
  currentUser: User;
  isAdmin: boolean;
  onSubmit: (data: CustomerFormData, force?: boolean) => Promise<void>;
  onCancel: () => void;
}

export function CustomerForm({
  customer,
  users,
  currentUser,
  isAdmin,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<CustomerConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<string[]>([]);

  const isEditMode = !!customer;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          company_name: customer.company_name,
          contact_name: customer.contact_name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address || '',
          transport_modes: customer.transport_modes,
          service_types: customer.service_types,
          incoterms: customer.incoterms,
          direction: customer.direction,
          origin_countries: customer.origin_countries,
          destination_countries: customer.destination_countries,
          source: customer.source,
          potential: customer.potential,
          status: customer.status,
          assigned_user_id: customer.assigned_user_id,
          notes: customer.notes || '',
        }
      : {
          company_name: '',
          contact_name: '',
          phone: '',
          email: '',
          address: '',
          transport_modes: [],
          service_types: [],
          incoterms: [],
          direction: [],
          origin_countries: [],
          destination_countries: [],
          source: 'Dijital',
          potential: 'Orta',
          status: 'Aktif',
          assigned_user_id: currentUser.id,
          notes: '',
        },
  });

  const watchedFields = watch();

  // Real-time conflict detection
  React.useEffect(() => {
    const checkConflicts = async () => {
      if (!watchedFields.company_name && !watchedFields.phone && !watchedFields.email) {
        setConflicts([]);
        return;
      }

      // Only check if we have enough data
      if (
        watchedFields.company_name.length < 3 &&
        watchedFields.phone.length < 5 &&
        watchedFields.email.length < 5
      ) {
        return;
      }

      try {
        const params = new URLSearchParams();
        if (watchedFields.company_name.length >= 3) {
          params.append('company_name', watchedFields.company_name);
        }
        if (watchedFields.phone.length >= 5) {
          params.append('phone', watchedFields.phone);
        }
        if (watchedFields.email.length >= 5) {
          params.append('email', watchedFields.email);
        }
        if (customer?.id) {
          params.append('exclude_id', customer.id);
        }

        const response = await fetch(`/api/customers/check-conflicts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setConflicts(data.conflicts || []);
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedFields.company_name, watchedFields.phone, watchedFields.email, customer?.id]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setFormErrors([]);

    try {
      await onSubmit(data, false);
    } catch (error: unknown) {
      const err = error as { conflicts?: CustomerConflict[]; message?: string; errors?: string[] };
      if (err.conflicts && err.conflicts.length > 0) {
        setConflicts(err.conflicts);
        setShowConflictModal(true);
      } else if (err.errors) {
        setFormErrors(err.errors);
      } else if (err.message) {
        setFormErrors([err.message]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceSubmit = async () => {
    setShowConflictModal(false);
    setIsSubmitting(true);

    try {
      await onSubmit(watchedFields, true);
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

  return (
    <>
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

        <ConflictWarning conflicts={conflicts} />

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Temel Bilgiler</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Firma Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="Firma adı giriniz"
                className={errors.company_name ? 'border-red-500' : ''}
              />
              {errors.company_name && (
                <p className="text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">
                Yetkili Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_name"
                {...register('contact_name')}
                placeholder="Yetkili adı giriniz"
                className={errors.contact_name ? 'border-red-500' : ''}
              />
              {errors.contact_name && (
                <p className="text-sm text-red-500">{errors.contact_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Telefon numarası giriniz"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                E-posta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="E-posta adresi giriniz"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Adres giriniz (opsiyonel)"
              />
            </div>
          </div>
        </div>

        {/* Transport Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Nakliye Tercihleri</h3>
          
          <div className="space-y-2">
            <Label>
              Taşıma Modu <span className="text-red-500">*</span>
            </Label>
            <MultiSelect
              options={TRANSPORT_MODES}
              value={watchedFields.transport_modes}
              onChange={(value) => setValue('transport_modes', value, { shouldValidate: true })}
              placeholder="Taşıma modu seçiniz"
            />
            {errors.transport_modes && (
              <p className="text-sm text-red-500">{errors.transport_modes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Servis Tipi <span className="text-red-500">*</span>
            </Label>
            <MultiSelect
              options={SERVICE_TYPES}
              value={watchedFields.service_types}
              onChange={(value) => setValue('service_types', value, { shouldValidate: true })}
              placeholder="Servis tipi seçiniz"
            />
            {errors.service_types && (
              <p className="text-sm text-red-500">{errors.service_types.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Satış Şekli (Incoterm) <span className="text-red-500">*</span>
            </Label>
            <MultiSelect
              options={INCOTERMS}
              value={watchedFields.incoterms}
              onChange={(value) => setValue('incoterms', value, { shouldValidate: true })}
              placeholder="Satış şekli seçiniz"
            />
            {errors.incoterms && (
              <p className="text-sm text-red-500">{errors.incoterms.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              İşlem Yönü <span className="text-red-500">*</span>
            </Label>
            <CheckboxGroup
              options={DIRECTIONS}
              value={watchedFields.direction}
              onChange={(value) => setValue('direction', value, { shouldValidate: true })}
            />
            {errors.direction && (
              <p className="text-sm text-red-500">{errors.direction.message}</p>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Lokasyon Bilgileri</h3>
          
          <div className="space-y-2">
            <Label>Çıkış Ülkeleri</Label>
            <MultiSelect
              options={COUNTRIES}
              value={watchedFields.origin_countries}
              onChange={(value) => setValue('origin_countries', value)}
              placeholder="Çıkış ülkelerini seçiniz"
            />
          </div>

          <div className="space-y-2">
            <Label>Varış Ülkeleri</Label>
            <MultiSelect
              options={COUNTRIES}
              value={watchedFields.destination_countries}
              onChange={(value) => setValue('destination_countries', value)}
              placeholder="Varış ülkelerini seçiniz"
            />
          </div>
        </div>

        {/* CRM Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">CRM Bilgileri</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Kaynak</Label>
              <Select
                value={watchedFields.source}
                onValueChange={(value) =>
                  setValue('source', value as typeof watchedFields.source, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kaynak seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="potential">Potansiyel</Label>
              <Select
                value={watchedFields.potential}
                onValueChange={(value) =>
                  setValue('potential', value as typeof watchedFields.potential, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Potansiyel seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {POTENTIALS.map((potential) => (
                    <SelectItem key={potential.value} value={potential.value}>
                      {potential.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Müşteri Durumu</Label>
              <Select
                value={watchedFields.status}
                onValueChange={(value) =>
                  setValue('status', value as typeof watchedFields.status, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Müşteri notları..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
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

      <ConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onConfirm={handleForceSubmit}
        conflicts={conflicts}
        isAdmin={isAdmin}
      />
    </>
  );
}
