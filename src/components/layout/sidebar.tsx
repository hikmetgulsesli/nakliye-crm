'use client';

<<<<<<< HEAD
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserRole } from '@/types';
=======
import Link from 'next/link';
import { usePathname } from 'next/navigation';
>>>>>>> origin/feature/crm-core-modules
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
<<<<<<< HEAD
  Briefcase,
  Phone,
  Menu,
  LogOut,
  UserCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: UserRole;
}

interface SidebarProps {
  userRole: UserRole;
  userName: string;
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Müşteriler', href: '/customers', icon: <Briefcase className="h-5 w-5" /> },
  { label: 'Teklifler', href: '/quotations', icon: <FileText className="h-5 w-5" /> },
  { label: 'Aktiviteler', href: '/activities', icon: <Phone className="h-5 w-5" /> },
  { label: 'Raporlar', href: '/reports', icon: <BarChart3 className="h-5 w-5" />, requiredRole: 'admin' },
  { label: 'Kullanıcılar', href: '/users', icon: <Users className="h-5 w-5" />, requiredRole: 'admin' },
  { label: 'Ayarlar', href: '/settings', icon: <Settings className="h-5 w-5" />, requiredRole: 'admin' },
];

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigation.filter(
    (item) => !item.requiredRole || item.requiredRole === userRole
  );

  return (
    <div className="flex h-full flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
          <Briefcase className="h-6 w-6 text-primary" />
          <span>Nakliye CRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3',
                (pathname === item.href || pathname.startsWith(`${item.href}/`)) && 'bg-secondary'
              )}
            >
              {item.icon}
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <UserCircle className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" className="w-full justify-start gap-3" type="submit">
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </Button>
        </form>
=======
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
>>>>>>> origin/feature/crm-core-modules
      </div>
    </div>
  );
}
<<<<<<< HEAD

export function MobileSidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const filteredNav = navigation.filter(
    (item) => !item.requiredRole || item.requiredRole === userRole
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menüyü Aç</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg" onClick={() => setOpen(false)}>
              <Briefcase className="h-6 w-6 text-primary" />
              <span>Nakliye CRM</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {filteredNav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <Button
                  variant={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    (pathname === item.href || pathname.startsWith(`${item.href}/`)) && 'bg-secondary'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 px-2 py-3">
              <UserCircle className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" className="w-full justify-start gap-3" type="submit">
                <LogOut className="h-5 w-5" />
                Çıkış Yap
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
=======
>>>>>>> origin/feature/crm-core-modules
