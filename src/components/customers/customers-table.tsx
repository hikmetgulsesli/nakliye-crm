'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Building2, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge, PotentialBadge } from '@/components/ui/badges';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CustomerWithUser } from '@/types';

interface CustomersTableProps {
  customers: CustomerWithUser[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function CustomersTable({ customers, isAdmin, onRefresh }: CustomersTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) return customers;
    const lowerSearch = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.company_name.toLowerCase().includes(lowerSearch) ||
        customer.contact_name.toLowerCase().includes(lowerSearch) ||
        customer.email.toLowerCase().includes(lowerSearch) ||
        customer.phone.toLowerCase().includes(lowerSearch) ||
        customer.assigned_user.full_name.toLowerCase().includes(lowerSearch)
    );
  }, [customers, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Müşteri silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Müşteri silinirken bir hata oluştu');
    } finally {
      setIsDeleting(null);
    }
  };

  const columns: Column<CustomerWithUser>[] = [
    {
      key: 'company_name',
      header: 'Firma',
      render: (customer: CustomerWithUser) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{customer.company_name}</div>
            <div className="text-sm text-muted-foreground">{customer.contact_name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'İletişim',
      render: (customer: CustomerWithUser) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {customer.phone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {customer.email}
          </div>
        </div>
      ),
    },
    {
      key: 'assigned_user',
      header: 'Temsilci',
      render: (customer: CustomerWithUser) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {customer.assigned_user.full_name}
        </div>
      ),
    },
    {
      key: 'potential',
      header: 'Potansiyel',
      render: (customer: CustomerWithUser) => (
        <PotentialBadge potential={customer.potential} />
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (customer: CustomerWithUser) => (
        <StatusBadge status={customer.status} />
      ),
    },
    {
      key: 'transport',
      header: 'Taşıma',
      render: (customer: CustomerWithUser) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {customer.transport_modes.join(', ')}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (customer: CustomerWithUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/customers/${customer.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => handleDelete(customer.id)}
                disabled={isDeleting === customer.id}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting === customer.id ? 'Siliniyor...' : 'Sil'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button size="sm" onClick={() => router.push('/customers/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(customer) => customer.id}
        emptyMessage="Müşteri bulunamadı"
      />
    </div>
  );
}
