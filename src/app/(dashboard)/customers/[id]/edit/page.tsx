'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/customers/customer-form';
import type { Customer, User } from '@/types/index.js';

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

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const meResponse = await fetch('/api/auth/me');
        if (!meResponse.ok) {
          router.push('/login');
          return;
        }
        const meData = await meResponse.json();
        setCurrentUser(meData.user);

        // Fetch customer
        const customerResponse = await fetch(`/api/customers/${customerId}`);
        if (!customerResponse.ok) {
          if (customerResponse.status === 404) {
            setError('Müşteri bulunamadı');
          } else {
            setError('Müşteri yüklenirken bir hata oluştu');
          }
          return;
        }
        const customerData = await customerResponse.json();
        setCustomer(customerData.customer);

        // Fetch users for dropdown
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users);
        }
      } catch {
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, customerId]);

  const handleSubmit = async (data: CustomerFormData, force?: boolean) => {
    const response = await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, force }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409 && result.conflicts) {
        // Conflict detected - throw with conflicts for modal
        const error = new Error('Conflict detected') as Error & { conflicts: typeof result.conflicts };
        error.conflicts = result.conflicts;
        throw error;
      }
      throw new Error(result.error || 'Müşteri güncellenirken bir hata oluştu');
    }

    router.push('/customers');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
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

  if (!currentUser || !customer) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşteri Düzenle</h1>
          <p className="text-slate-600">{customer.company_name}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerForm
          customer={customer}
          users={users}
          currentUser={currentUser}
          isAdmin={currentUser.role === 'admin'}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/customers')}
        />
      </div>
    </div>
  );
}
