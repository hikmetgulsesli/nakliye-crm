'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Edit, 
  Printer, 
  FileText, 
  Calendar, 
  DollarSign,
  User as UserIcon,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badges';
import { RevisionHistory } from '@/components/quotations/revision-history';
import type { QuotationWithCustomer, QuotationRevisionWithUser } from '@/types/quotations';
import type { User } from '@/types';

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [quotation, setQuotation] = React.useState<QuotationWithCustomer | null>(null);
  const [revisions, setRevisions] = React.useState<QuotationRevisionWithUser[]>([]);
  const [, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch session
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/login');
          return;
        }
        const sessionData = await sessionRes.json();
        setCurrentUser(sessionData.user);

        // Fetch quotation
        const quotationRes = await fetch(`/api/quotations/${id}`);
        if (!quotationRes.ok) {
          if (quotationRes.status === 404) {
            setError('Teklif bulunamadı');
          } else {
            setError('Teklif yüklenirken bir hata oluştu');
          }
          setIsLoading(false);
          return;
        }
        const quotationData = await quotationRes.json();
        setQuotation(quotationData.quotation);

        // Fetch revisions
        const revisionsRes = await fetch(`/api/quotations/${id}/revisions`);
        if (revisionsRes.ok) {
          const revisionsData = await revisionsRes.json();
          setRevisions(revisionsData.revisions || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Teklif yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return '-';
    return `${price.toLocaleString('tr-TR')} ${currency || ''}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-muted-foreground">{error || 'Teklif bulunamadı'}</p>
        <Button onClick={() => router.push('/quotations')}>
          Tekliflere Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/quotations')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quotation.quote_no}</h1>
            <p className="text-muted-foreground">{quotation.customer.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>
          <Button size="sm" onClick={() => router.push(`/quotations/${quotation.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm print:border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durum</p>
                <div className="mt-1">
                  <StatusBadge status={quotation.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Revizyon</p>
                <p className="text-2xl font-bold">{quotation.revision_count}</p>
              </div>
            </div>
            {quotation.status === 'Kaybedildi' && quotation.loss_reason && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Kaybedilme Nedeni</p>
                <p className="text-sm text-red-700">{quotation.loss_reason}</p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm print:border-2">
            <h3 className="mb-4 text-lg font-medium">Temel Bilgiler</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teklif No</p>
                  <p className="font-medium">{quotation.quote_no}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teklif Tarihi</p>
                  <p className="font-medium">{formatDate(quotation.quote_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Geçerlilik Tarihi</p>
                  <p className="font-medium">{quotation.validity_date ? formatDate(quotation.validity_date) : '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Oluşturulma</p>
                  <p className="font-medium">{formatDate(quotation.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm print:border-2">
            <h3 className="mb-4 text-lg font-medium">Yük Hareketi Bilgileri</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Taşıma Modu</p>
                <p className="font-medium">{quotation.transport_mode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servis Tipi</p>
                <p className="font-medium">{quotation.service_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Çıkış Ülkesi</p>
                <p className="font-medium">{quotation.origin_country}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Varış Ülkesi</p>
                <p className="font-medium">{quotation.destination_country}</p>
              </div>
              {quotation.pol && (
                <div>
                  <p className="text-sm text-muted-foreground">Yükleme Noktası (POL)</p>
                  <p className="font-medium">{quotation.pol}</p>
                </div>
              )}
              {quotation.pod && (
                <div>
                  <p className="text-sm text-muted-foreground">Varış Noktası (POD)</p>
                  <p className="font-medium">{quotation.pod}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Satış Şekli (Incoterm)</p>
                <p className="font-medium">{quotation.incoterm}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border bg-card p-6 shadow-sm print:border-2">
            <h3 className="mb-4 text-lg font-medium">Fiyat Bilgileri</h3>
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(quotation.price, quotation.currency)}
                </p>
              </div>
            </div>
            {quotation.price_note && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Fiyat Notu</p>
                <p className="mt-1">{quotation.price_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Müşteri</h3>
            <Link 
              href={`/customers/${quotation.customer_id}`}
              className="group block"
            >
              <p className="font-medium group-hover:text-primary">{quotation.customer.company_name}</p>
              <p className="text-sm text-muted-foreground">{quotation.customer.contact_name}</p>
            </Link>
          </div>

          {/* Assignment */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Atama</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Atanan Temsilci</p>
                  <p className="font-medium">{quotation.assigned_user.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Oluşturan</p>
                  <p className="font-medium">{quotation.created_by_user.full_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revision History */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Revizyon Geçmişi</h3>
            <RevisionHistory revisions={revisions} />
          </div>
        </div>
      </div>
    </div>
  );
}
