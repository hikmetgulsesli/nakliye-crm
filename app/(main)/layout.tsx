import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b131a]">
      <Sidebar 
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }} 
      />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
