'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, User, TrendingUp, Activity, Plus, FileText, History, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, PotentialBadge } from '@/components/ui/badges';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActivityTimeline } from '@/components/activities/activity-timeline';
import { ActivityForm } from '@/components/activities/activity-form';
import { AuditHistory } from '@/components/audit/audit-history';
import type { CustomerWithUser, ActivityWithUser, AuditLogWithUser, CreateActivityInput } from '@/types/index';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [customer, setCustomer] = React.useState<CustomerWithUser | null>(null);
  const [activities, setActivities] = React.useState<ActivityWithUser[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogWithUser[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [showActivityForm, setShowActivityForm] = React.useState(false);
  const [isSubmittingActivity, setIsSubmittingActivity] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, activitiesRes, auditRes] = await Promise.all([
          fetch(`/api/customers/${customerId}`),
          fetch(`/api/activities?customer_id=${customerId}`),
          fetch(`/api/audit-log?record_type=customer&record_id=${customerId}`),
        ]);

        if (!customerRes.ok) {
          if (customerRes.status === 404) {
            setError('Müşteri bulunamadı');
          } else {
            setError('Müşteri yüklenirken bir hata oluştu');
          }
          return;
        }

        const customerData = await customerRes.json();
        setCustomer(customerData.customer);

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData.activities || []);
        }

        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData.logs || []);
        }
      } catch {
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const handleAddActivity = async (data: CreateActivityInput) => {
    setIsSubmittingActivity(true);
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Aktivite kaydedilemedi');
      }

      // Refresh activities
      const activitiesRes = await fetch(`/api/activities?customer_id=${customerId}`);
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }

      // Refresh customer (for last_contact_date)
      const customerRes = await fetch(`/api/customers/${customerId}`);
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData.customer);
      }

      // Refresh audit logs
      const auditRes = await fetch(`/api/audit-log?record_type=customer&record_id=${customerId}`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }

      setShowActivityForm(false);
    } catch {
      alert('Aktivite kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{customer.company_name}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{customer.contact_name}</span>
              <span>·</span>
              <StatusBadge status={customer.status} />
              <PotentialBadge potential={customer.potential} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowActivityForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Aktivite Ekle
          </Button>
          <Button onClick={() => router.push(`/customers/${customer.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            Son Görüşme
          </div>
          <p className="mt-1 text-lg font-semibold">
            {customer.last_contact_date
              ? new Date(customer.last_contact_date).toLocaleDateString('tr-TR')
              : '-'}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <TrendingUp className="h-4 w-4" />
            Son Teklif
          </div>
          <p className="mt-1 text-lg font-semibold">
            {customer.last_quote_date
              ? new Date(customer.last_quote_date).toLocaleDateString('tr-TR')
              : '-'}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Activity className="h-4 w-4" />
            Aktivite Sayısı
          </div>
          <p className="mt-1 text-lg font-semibold">{activities.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4" />
            Temsilci
          </div>
          <p className="mt-1 text-lg font-semibold">{customer.assigned_user.full_name}</p>
        </div>
      </div>

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Yeni Aktivite</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowActivityForm(false)}>
                ✕
              </Button>
            </div>
            <ActivityForm
              customerId={customer.id}
              onSubmit={handleAddActivity}
              onCancel={() => setShowActivityForm(false)}
              loading={isSubmittingActivity}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Activity className="mr-2 h-4 w-4" />
            Aktiviteler
            {activities.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">
                {activities.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <FileText className="mr-2 h-4 w-4" />
            Teklifler
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Information */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Temel Bilgiler</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Yetkili</p>
                      <p className="font-medium">{customer.contact_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Telefon</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">E-posta</p>
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                  {customer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Adres</p>
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
                  <div>
                    <p className="text-sm text-slate-500">Taşıma Modu</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {customer.transport_modes.map((mode) => (
                        <span key={mode} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Servis Tipi</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {customer.service_types.map((type) => (
                        <span key={type} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Satış Şekli (Incoterm)</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {customer.incoterms.map((term) => (
                        <span key={term} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">İşlem Yönü</p>
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

              {/* Location */}
              {(customer.origin_countries.length > 0 || customer.destination_countries.length > 0) && (
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Lokasyon Bilgileri</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {customer.origin_countries.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-500">Çıkış Ülkeleri</p>
                        <p className="mt-1 font-medium">{customer.origin_countries.join(', ')}</p>
                      </div>
                    )}
                    {customer.destination_countries.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-500">Varış Ülkeleri</p>
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
                    <span className="text-sm text-slate-500">Kaynak</span>
                    <span className="font-medium">{customer.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Potansiyel</span>
                    <PotentialBadge potential={customer.potential} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Durum</span>
                    <StatusBadge status={customer.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Atanan Temsilci</span>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{customer.assigned_user.full_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Created By */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Kayıt Bilgileri</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Oluşturan</span>
                    <span className="font-medium">{customer.created_by_user.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Kayıt Tarihi</span>
                    <span className="font-medium">
                      {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivityTimeline
            activities={activities}
            onAddActivity={() => setShowActivityForm(true)}
            loading={isLoading}
          />
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">Teklifler</h3>
            <p className="mt-2 text-sm text-slate-600">
              Teklif modülü yakında eklenecek.
            </p>
            <Button className="mt-4" onClick={() => router.push(`/quotations/new?customer_id=${customer.id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Teklif Oluştur
            </Button>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <AuditHistory logs={auditLogs} loading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}