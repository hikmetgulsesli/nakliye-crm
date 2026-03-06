'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
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
      </div>
    </div>
  );
}

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
