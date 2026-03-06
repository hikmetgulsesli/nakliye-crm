'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Building2, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
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

  const columns: ColumnDef<CustomerWithUser>[] = [
    {
      id: 'company_name',
      header: 'Firma',
      accessorFn: (row) => row.company_name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.company_name}</div>
            <div className="text-sm text-muted-foreground">{row.original.contact_name}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'İletişim',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.phone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      id: 'assigned_user',
      header: 'Temsilci',
      accessorFn: (row) => row.assigned_user.full_name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {row.original.assigned_user.full_name}
        </div>
      ),
    },
    {
      id: 'potential',
      header: 'Potansiyel',
      accessorFn: (row) => row.potential,
      cell: ({ row }) => <PotentialBadge potential={row.original.potential} />,
    },
    {
      id: 'status',
      header: 'Durum',
      accessorFn: (row) => row.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'transport',
      header: 'Taşıma',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {row.original.transport_modes.join(', ')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/customers/${row.original.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting === row.original.id}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting === row.original.id ? 'Siliniyor...' : 'Sil'}
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
      />
    </div>
  );
}
