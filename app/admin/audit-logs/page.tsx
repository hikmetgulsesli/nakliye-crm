import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AuditLogsClient } from "@/components/admin/AuditLogsClient";

export const metadata: Metadata = {
  title: "Denetim Kayıtları - Admin",
  description: "Sistem denetim kayıtlarını görüntüleyin",
};

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between px-10 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Denetim Kayıtları</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistemde yapılan tüm işlemlerin kayıtları
          </p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AuditLogsClient />
      </div>
    </div>
  );
}
