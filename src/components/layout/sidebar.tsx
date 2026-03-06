'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Truck,
  Phone,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface SidebarProps {
  userRole: UserRole;
  isMobile?: boolean;
  onNavigate?: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Müşteriler', href: '/customers', icon: Users },
  { label: 'Teklifler', href: '/quotations', icon: FileText },
  { label: 'Aktiviteler', href: '/activities', icon: Phone },
  { label: 'Raporlar', href: '/reports', icon: BarChart3, roles: ['admin'] as UserRole[] },
  { label: 'Kullanıcılar', href: '/users', icon: UserCircle, roles: ['admin'] as UserRole[] },
  { label: 'Ayarlar', href: '/settings', icon: Settings, roles: ['admin'] as UserRole[] },
];

export function Sidebar({ userRole, isMobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className={cn('flex h-full flex-col bg-slate-900 text-white', isMobile && 'w-full')}>
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Truck className="h-6 w-6 text-blue-400" />
          <span className="text-lg">Nakliye CRM</span>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Link
          href="/profile"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/profile'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
        >
          <UserCircle className="h-5 w-5" />
          Profil
        </Link>
      </div>
    </div>
  );
}
