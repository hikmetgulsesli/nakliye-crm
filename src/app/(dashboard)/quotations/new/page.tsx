'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationForm } from '@/components/quotations/quotation-form';
import type { User, Customer } from '@/types';
import type { CreateQuotationInput } from '@/types/quotations';

export default function NewQuotationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);

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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleSubmit = async (data: CreateQuotationInput) => {
    const response = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push('/quotations');
      router.refresh();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Teklif oluşturulurken bir hata oluştu');
    }
  };

  const handleCancel = () => {
    router.push('/quotations');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/quotations">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Geri
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yeni Teklif</h1>
          <p className="text-muted-foreground">Yeni bir teklif oluşturun</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <QuotationForm
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
