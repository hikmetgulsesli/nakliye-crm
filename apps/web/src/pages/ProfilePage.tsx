import { useState, useRef, type ChangeEvent } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, Button, Input, Icon, Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import api from '@/config/api';

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

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

  // --- Loading & feedback ---
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (type: AlertState['type'], message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

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

  // --- Handlers ---

  const handleProfileSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      showAlert('error', 'Ad Soyad alani bos birakilamaz.');
      return;
    }
    if (!trimmedEmail) {
      showAlert('error', 'E-posta alani bos birakilamaz.');
      return;
    }
    setFullName(trimmedName);
    setEmail(trimmedEmail);
    setProfileSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', { fullName: trimmedName, email: trimmedEmail });
      if (user) {
        setUser({ ...user, fullName: data.fullName ?? fullName, email: data.email ?? email });
      }
      showAlert('success', 'Profil bilgileri basariyla guncellendi.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Profil guncellenirken bir hata olustu.';
      showAlert('error', message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert('error', 'Tum sifre alanlarini doldurun.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      showAlert('error', 'Yeni sifreler eslemiyor.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('error', 'Yeni sifre en az 6 karakter olmalidir.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/auth/profile/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('success', 'Sifre basariyla guncellendi.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Sifre guncellenirken bir hata olustu.';
      showAlert('error', message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const handleTwoFactorToggle = async () => {
    setTwoFactorLoading(true);
    try {
      if (twoFactorEnabled) {
        await api.post('/auth/2fa/disable');
        setTwoFactorEnabled(false);
        setTwoFactorSecret(null);
        showAlert('success', '2FA devre disi birakildi.');
      } else {
        const { data } = await api.post('/auth/2fa/enable');
        setTwoFactorEnabled(true);
        setTwoFactorSecret(data.secret || null);
        showAlert('success', '2FA etkinlestirildi.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '2FA isleminde bir hata olustu.';
      showAlert('error', message);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setNotifSaving(true);
    try {
      await api.patch('/auth/profile', {
        fullName,
        email,
        notificationPreferences: {
          emailNotifications,
          dailySummary,
          criticalAlerts,
        },
      });
      showAlert('success', 'Bildirim tercihleri kaydedildi.');
    } catch {
      showAlert('error', 'Bildirim tercihleri kaydedilirken bir hata olustu.');
    } finally {
      setNotifSaving(false);
    }
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

      {/* Alert banner */}
      {alert && (
        <div
          className={cn(
            'mb-4 rounded-lg border p-3 text-sm flex items-center gap-2',
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700',
          )}
        >
          <span className="material-symbols-outlined text-[18px]">
            {alert.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {alert.message}
        </div>
      )}

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

            <Button
              className="w-full"
              icon="save"
              onClick={handleProfileSave}
              disabled={profileSaving}
            >
              {profileSaving ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
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
                onClick={handleTwoFactorToggle}
                disabled={twoFactorLoading}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  twoFactorEnabled ? 'bg-primary' : 'bg-slate-300',
                  twoFactorLoading && 'opacity-50 cursor-not-allowed',
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

            {/* 2FA Secret / QR placeholder */}
            {twoFactorEnabled && twoFactorSecret && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-1">
                  2FA Kurulum Anahtari
                </p>
                <code className="block text-sm font-mono bg-white px-3 py-2 rounded border border-slate-200 text-slate-900 break-all select-all">
                  {twoFactorSecret}
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  Bu anahtari Google Authenticator veya benzeri bir uygulamaya girin.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              icon="lock"
              variant="secondary"
              onClick={handlePasswordUpdate}
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Guncelleniyor...' : 'Sifreyi Guncelle'}
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

        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button
            icon="save"
            variant="secondary"
            onClick={handleNotificationSave}
            disabled={notifSaving}
          >
            {notifSaving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
