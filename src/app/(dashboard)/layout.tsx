import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { UserRole } from '@/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);

  if (!payload) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar 
          userRole={payload.role as UserRole} 
          userName={payload.full_name} 
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          userRole={payload.role as UserRole}
          userName={payload.full_name}
          userEmail={payload.email}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
