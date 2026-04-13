import { useState, useRef, type ChangeEvent } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, Button, Input, Icon, Badge } from '@/components/ui';
import { cn } from '@/utils/cn';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  // --- Personal Info state ---
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Security state ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // --- Notification Preferences ---
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  // Password strength
  const getPasswordStrength = (
    pw: string,
  ): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: '', color: '', width: '0%' };
    if (pw.length < 6)
      return { label: 'Zayif', color: 'bg-red-500', width: '25%' };
    if (pw.length < 10)
      return { label: 'Orta', color: 'bg-amber-500', width: '50%' };
    if (/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(pw))
      return { label: 'Guclu', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Iyi', color: 'bg-blue-500', width: '75%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Profil ve Hesap Ayarlari' },
        ]}
        title="Profil ve Hesap Ayarlari"
        subtitle="Kisisel bilgilerinizi ve guvenlik ayarlarinizi yonetin."
      />

      {/* Two-card top row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Personal Info Card */}
        <Card title="Kisisel Bilgiler">
          <div className="flex flex-col items-center gap-6">
            {/* Avatar with camera overlay */}
            <div className="relative group">
              <div
                className="size-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600 overflow-hidden cursor-pointer"
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{getInitials(fullName || 'K')}</span>
                )}
              </div>
              {/* Camera overlay */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Icon name="photo_camera" className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Role badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <Badge variant={user?.role === 'ADMIN' ? 'info' : 'neutral'} size="sm">
                  {user?.role === 'ADMIN' ? 'ADMIN' : 'KULLANICI'}
                </Badge>
              </div>
            </div>

            {/* Form fields */}
            <div className="w-full space-y-4 mt-2">
              <Input
                label="Ad Soyad"
                icon="person"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="E-posta"
                icon="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button className="w-full" icon="save">
              Degisiklikleri Kaydet
            </Button>
          </div>
        </Card>

        {/* Security Card */}
        <Card title="Guvenlik">
          <div className="space-y-4">
            <Input
              label="Mevcut Sifre"
              icon="lock"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Mevcut sifrenizi girin"
            />
            <Input
              label="Yeni Sifre"
              icon="lock"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni sifrenizi girin"
            />

            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-1.5">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      strength.color,
                    )}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Sifre Gucu: <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}

            <Input
              label="Yeni Sifre (Tekrar)"
              icon="lock"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni sifrenizi tekrar girin"
              error={
                confirmPassword && confirmPassword !== newPassword
                  ? 'Sifreler eslesmiyor'
                  : undefined
              }
            />

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Iki Faktorlu Dogrulama
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hesabiniza ekstra guvenlik katmani ekleyin.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  twoFactorEnabled ? 'bg-primary' : 'bg-slate-300',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>

            <Button className="w-full" icon="lock" variant="secondary">
              Sifreyi Guncelle
            </Button>
          </div>
        </Card>
      </div>

      {/* Full-width Notification Preferences */}
      <Card title="Bildirim Tercihleri">
        <div className="divide-y divide-slate-200">
          {/* Email Notifications */}
          <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-900">
                E-posta Bildirimleri
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Onemli guncellemeler icin e-posta alabilirsiniz.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                emailNotifications ? 'bg-primary' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  emailNotifications ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {/* Daily Summary */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Gunluk Ozet E-postasi
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Her gun saat 09:00'da gunluk aktivite ozeti alin.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dailySummary}
              onClick={() => setDailySummary(!dailySummary)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                dailySummary ? 'bg-primary' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  dailySummary ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {/* Critical Alerts */}
          <div className="flex items-center justify-between py-4 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Kritik Uyari Bildirimleri
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Acil durumlarda anlik bildirim alin.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={criticalAlerts}
              onClick={() => setCriticalAlerts(!criticalAlerts)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                criticalAlerts ? 'bg-primary' : 'bg-slate-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  criticalAlerts ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
