'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, FileText, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { QuotationWithCustomer } from '@/types/quotations';

interface QuotationsTableProps {
  quotations: QuotationWithCustomer[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function QuotationsTable({ quotations, isAdmin, onRefresh }: QuotationsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const filteredQuotations = React.useMemo(() => {
    let result = quotations;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (q) =>
          q.quote_no.toLowerCase().includes(lowerSearch) ||
          q.customer.company_name.toLowerCase().includes(lowerSearch) ||
          q.assigned_user.full_name.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((q) => q.status === statusFilter);
    }

    return result;
  }, [quotations, searchTerm, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu teklifi silmek istediğinize emin misiniz?')) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Teklif silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Teklif silinirken bir hata oluştu');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return '-';
    return `${price.toLocaleString('tr-TR')} ${currency || ''}`;
  };

  const columns: Column<QuotationWithCustomer>[] = [
    {
      key: 'quote_no',
      header: 'Teklif No',
      cell: (q: QuotationWithCustomer) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{q.quote_no}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      cell: (q: QuotationWithCustomer) => (
        <div>
          <div className="font-medium">{q.customer.company_name}</div>
          <div className="text-sm text-muted-foreground">{q.customer.contact_name}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Tarihler',
      cell: (q: QuotationWithCustomer) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>T: {formatDate(q.quote_date)}</span>
          </div>
          <div className="text-muted-foreground">
            G: {q.validity_date ? formatDate(q.validity_date) : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'transport',
      header: 'Taşıma',
      cell: (q: QuotationWithCustomer) => (
        <div className="space-y-1 text-sm">
          <div>{q.transport_mode}</div>
          <div className="text-muted-foreground">{q.service_type}</div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Güzergah',
      cell: (q: QuotationWithCustomer) => (
        <div className="text-sm">
          <div>{q.origin_country} → {q.destination_country}</div>
          <div className="text-muted-foreground">{q.incoterm}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Fiyat',
      cell: (q: QuotationWithCustomer) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatPrice(q.price, q.currency)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (q: QuotationWithCustomer) => <StatusBadge status={q.status} />,
    },
    {
      key: 'assigned_user',
      header: 'Temsilci',
      cell: (q: QuotationWithCustomer) => (
        <span className="text-sm">{q.assigned_user.full_name}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      cell: (q: QuotationWithCustomer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/quotations/${q.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Detay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/quotations/${q.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => handleDelete(q.id)}
                disabled={isDeleting === q.id}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting === q.id ? 'Siliniyor...' : 'Sil'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Teklif ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Tümü</option>
            <option value="Bekliyor">Bekliyor</option>
            <option value="Kazanildi">Kazanıldı</option>
            <option value="Kaybedildi">Kaybedildi</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button size="sm" onClick={() => router.push('/quotations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Teklif
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredQuotations}
        keyExtractor={(q) => q.id}
        emptyMessage="Teklif bulunamadı"
      />
    </div>
  );
}
