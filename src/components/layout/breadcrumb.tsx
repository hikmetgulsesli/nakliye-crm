'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Müşteriler',
  quotations: 'Teklifler',
  activities: 'Aktiviteler',
  reports: 'Raporlar',
  users: 'Kullanıcılar',
  settings: 'Ayarlar',
  profile: 'Profil',
};

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className={cn('flex items-center text-sm text-slate-600', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Ana Sayfa</span>
          </Link>
        </li>
        
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label = breadcrumbLabels[segment] || segment;

          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4 text-slate-400" />
              {isLast ? (
                <span className="font-medium text-slate-900">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-slate-500 hover:text-blue-600"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
