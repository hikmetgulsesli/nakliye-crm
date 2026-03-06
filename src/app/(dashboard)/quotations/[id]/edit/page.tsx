'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationForm } from '@/components/quotations/quotation-form';
import type { User, Customer } from '@/types';
import type { QuotationWithCustomer, UpdateQuotationInput } from '@/types/quotations';

interface EditQuotationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuotationPage({ params }: EditQuotationPageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [isLoading, setIsLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [quotation, setQuotation] = React.useState<QuotationWithCustomer | null>(null);
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
        setIsAdmin(sessionData.user.role === 'admin');

        // Fetch users
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }

        // Fetch customers
        const customersRes = await fetch('/api/customers');
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }

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
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Veri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleSubmit = async (data: UpdateQuotationInput) => {
    const response = await fetch(`/api/quotations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/quotations/${id}`);
      router.refresh();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Teklif güncellenirken bir hata oluştu');
    }
  };

  const handleCancel = () => {
    router.push(`/quotations/${id}`);
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

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/quotations/${id}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Teklif Düzenle</h1>
          <p className="text-muted-foreground">{quotation.quote_no}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <QuotationForm
          quotation={quotation}
          customers={customers}
          users={users}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
