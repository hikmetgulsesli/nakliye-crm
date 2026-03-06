'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

<<<<<<< HEAD
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Map paths to Turkish labels
const pathLabels: Record<string, string> = {
=======
const breadcrumbLabels: Record<string, string> = {
>>>>>>> origin/feature/crm-core-modules
  dashboard: 'Dashboard',
  customers: 'Müşteriler',
  quotations: 'Teklifler',
  activities: 'Aktiviteler',
  reports: 'Raporlar',
  users: 'Kullanıcılar',
  settings: 'Ayarlar',
  profile: 'Profil',
<<<<<<< HEAD
  new: 'Yeni',
  edit: 'Düzenle',
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Skip if on root or dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = [
    { label: 'Ana Sayfa', href: '/dashboard' },
    ...segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = pathLabels[segment] || segment;
      // Last segment is current page, no href
      return index === segments.length - 1 
        ? { label } 
        : { label, href };
    }),
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-4 w-4" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground',
                  index === 0 && 'flex items-center gap-1'
                )}
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                <span className={index === 0 ? 'sr-only sm:not-sr-only' : ''}>
                  {item.label}
                </span>
              </Link>
            ) : (
              <span className="font-medium text-foreground" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
=======
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
>>>>>>> origin/feature/crm-core-modules
      </ol>
    </nav>
  );
}
