<<<<<<< HEAD
=======
<<<<<<< HEAD
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
=======
>>>>>>> origin/feature/crm-core-modules
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/index';
import { Sidebar } from '@/components/layout/sidebar';
<<<<<<< HEAD
import { Header } from '@/components/layout/header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { UserRole } from '@/types';
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Breadcrumb } from '@/components/layout/breadcrumb';
>>>>>>> origin/feature/crm-core-modules

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
<<<<<<< HEAD
  const session = await getServerSession(authOptions);

  if (!session?.user) {
=======
<<<<<<< HEAD
  const session = await getSession();

  if (!session) {
=======
  const session = await getServerSession(authOptions);

  if (!session?.user) {
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
>>>>>>> origin/feature/crm-core-modules
    redirect('/login');
  }

  return (
<<<<<<< HEAD
=======
<<<<<<< HEAD
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar userRole={session.user.role} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        
=======
>>>>>>> origin/feature/crm-core-modules
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar 
          userRole={session.user.role as UserRole} 
          userName={session.user.name ?? ''} 
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          userRole={session.user.role as UserRole}
          userName={session.user.name ?? ''}
          userEmail={session.user.email ?? ''}
        />
<<<<<<< HEAD
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Breadcrumb />
          {children}
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb className="mb-4" />
            {children}
          </div>
>>>>>>> origin/feature/crm-core-modules
        </main>
      </div>
    </div>
  );
}
