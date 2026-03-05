'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, User, Building2, Package, Globe, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, PotentialBadge } from '@/components/ui/badges';
import type { CustomerWithUser } from '@/types';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [customer, setCustomer] = React.useState<CustomerWithUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Müşteri bulunamadı');
          } else {
            setError('Müşteri yüklenirken bir hata oluştu');
          }
          return;
        }
        const data = await response.json();
        setCustomer(data.customer);
      } catch {
        setError('Müşteri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error || 'Müşteri bulunamadı'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/customers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Müşterilere Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.company_name}</h1>
            <p className="text-slate-600">Müşteri Detayı</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/customers/${customer.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Düzenle
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Temel Bilgiler</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Yetkili</p>
                  <p className="font-medium">{customer.contact_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">E-posta</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adres</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transport Preferences */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Nakliye Tercihleri</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Taşıma Modu</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {customer.transport_modes.map((mode) => (
                      <span key={mode} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{mode}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Servis Tipi</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {customer.service_types.map((type) => (
                      <span key={type} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Satış Şekli (Incoterm)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {customer.incoterms.map((term) => (
                      <span key={term} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">{term}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">İşlem Yönü</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {customer.direction.map((dir) => (
                      <span key={dir} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {dir === 'Ithalat' ? 'İthalat' : 'İhracat'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {(customer.origin_countries.length > 0 || customer.destination_countries.length > 0) && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Lokasyon Bilgileri</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {customer.origin_countries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Çıkış Ülkeleri</p>
                    <p className="mt-1 font-medium">{customer.origin_countries.join(', ')}</p>
                  </div>
                )}
                {customer.destination_countries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Varış Ülkeleri</p>
                    <p className="mt-1 font-medium">{customer.destination_countries.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Notlar</h2>
              <p className="whitespace-pre-wrap text-sm">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CRM Info */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">CRM Bilgileri</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kaynak</span>
                <span className="font-medium">{customer.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potansiyel</span>
                <PotentialBadge potential={customer.potential} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durum</span>
                <StatusBadge status={customer.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Atanan Temsilci</span>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{customer.assigned_user.full_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Tarihler</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Son Görüşme</p>
                  <p className="font-medium">
                    {customer.last_contact_date
                      ? new Date(customer.last_contact_date).toLocaleDateString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Son Teklif</p>
                  <p className="font-medium">
                    {customer.last_quote_date
                      ? new Date(customer.last_quote_date).toLocaleDateString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                  <p className="font-medium">
                    {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Created By */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Kayıt Bilgileri</h2>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Oluşturan</p>
                <p className="font-medium">{customer.created_by_user.full_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
