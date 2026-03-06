import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard | Nakliye CRM",
  description: "CRM Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text">
          Hoş Geldiniz, {session.user?.name}
        </h1>
        <p className="text-text-muted mt-1">
          Uluslararası nakliye CRM sistemine başarıyla giriş yaptınız.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <div className="text-sm font-medium text-text-muted">Toplam Müşteri</div>
          <div className="mt-2 text-3xl font-bold text-primary">0</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <div className="text-sm font-medium text-text-muted">Aktif Teklif</div>
          <div className="mt-2 text-3xl font-bold text-accent">0</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <div className="text-sm font-medium text-text-muted">Bu Ay Görüşme</div>
          <div className="mt-2 text-3xl font-bold text-success">0</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-6">
          <div className="text-sm font-medium text-text-muted">Kazanma Oranı</div>
          <div className="mt-2 text-3xl font-bold text-info">0%</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <h2 className="font-heading text-lg font-semibold text-text">Son Aktiviteler</h2>
        <p className="text-text-muted mt-2">Henüz aktivite kaydı bulunmuyor.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <h3 className="font-heading font-medium text-text mb-4">Sistem Durumu</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="text-sm text-text-muted">Veritabanı bağlantısı aktif</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="text-sm text-text-muted">Kimlik doğrulama sistemi çalışıyor</span>
        </div>
      </div>
    </div>
  );
}
