'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/customers/customer-form';
import type { User } from '@/types';

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

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
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
  }, [router]);

  const handleSubmit = async (data: CustomerFormData, force?: boolean) => {
    const response = await fetch('/api/customers', {
      method: 'POST',
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
      throw new Error(result.error || 'Müşteri oluşturulurken bir hata oluştu');
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

  if (error || !currentUser) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error || 'Oturum bulunamadı'}</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Yeni Müşteri</h1>
          <p className="text-slate-600">Yeni müşteri kaydı oluşturun</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerForm
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
