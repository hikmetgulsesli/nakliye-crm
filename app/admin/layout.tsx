"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navLinkClass = (path: string) => {
    const active = isActive(path);
    return active
      ? "text-primary text-sm font-bold leading-normal border-b-2 border-primary pb-1"
      : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal transition-colors";
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Admin Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-slate-900 z-10 sticky top-0">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="size-6 text-primary">
            <span className="material-symbols-outlined text-2xl">settings</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] font-display">
            Admin
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden lg:flex items-center gap-9">
            <Link 
              className={navLinkClass("/admin/users")}
              href="/admin/users"
            >
              Kullanıcılar
            </Link>
            <Link 
              className={navLinkClass("/admin/metadata")}
              href="/admin/metadata"
            >
              Metadata Lists
            </Link>
            <Link 
              className={navLinkClass("/admin/audit-logs")}
              href="/admin/audit-logs"
            >
              Denetim Kayıtları
            </Link>
          </nav>
          <div className="flex gap-2">
            <button className="flex items-center justify-center overflow-hidden rounded-full size-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="flex items-center justify-center overflow-hidden rounded-full size-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
