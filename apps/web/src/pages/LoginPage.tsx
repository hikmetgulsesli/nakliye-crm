import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useBrand } from '@/stores/brandStore';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const brand = useBrand();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const res = await authService.login({
        email: data.email,
        password: data.password,
      });
      login(res.user, res.accessToken);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || 'Giriş başarısız. Bilgilerinizi kontrol ediniz.',
      );
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* Background: MiniMax ile uretilen nakliye liman fotografi */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      {/* Soldan saga koyudan saydama gradient: yazilar okunur, sag taraftaki login card'i arkasinda detay kalir */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/55 to-[#0f172a]/70" />
      <div className="absolute inset-0 bg-[#0f172a]/20" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {brand.logoDarkUrl || brand.logoUrl ? (
            <img
              src={brand.logoDarkUrl || brand.logoUrl || ''}
              alt={brand.companyName}
              className="h-10 max-w-[180px] object-contain"
            />
          ) : (
            <>
              <div className="flex size-10 items-center justify-center rounded-full bg-[#e30a17]">
                <span className="material-symbols-outlined text-[22px] text-white">
                  local_shipping
                </span>
              </div>
              <span className="text-lg font-bold text-white">{brand.companyName}</span>
            </>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          <Link to="/hakkimizda" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hakkımızda
          </Link>
          <Link to="/hizmetler" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hizmetler
          </Link>
          <Link to="/iletisim" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            İletişim
          </Link>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            TR
          </span>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-end px-8 py-12 lg:px-24">
        {/* Login Card */}
        <div className="w-full max-w-[460px] rounded-[28px] bg-white p-10 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.65)] ring-1 ring-slate-900/5">
          {/* Globe Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e30a17]/10 ring-1 ring-[#e30a17]/15">
              <span className="material-symbols-outlined text-[28px] text-[#e30a17]">
                public
              </span>
            </div>
          </div>

          <h1 className="text-center text-[28px] font-black leading-tight tracking-tight text-slate-900">
            Hoş Geldiniz
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Devam etmek için hesabınıza giriş yapın
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              <span className="material-symbols-outlined text-[18px] text-red-500 mt-0.5 shrink-0">
                error
              </span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-800">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500">
                  mail
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="örnek@sirket.com"
                  className={cn(
                    'h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400',
                    'focus:outline-none focus:ring-4',
                    errors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 bg-red-50/40'
                      : 'border-slate-200 focus:border-[#e30a17] focus:ring-[#e30a17]/15 focus:bg-white',
                  )}
                  {...register('email', {
                    required: 'E-posta adresi zorunludur',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Geçerli bir e-posta adresi giriniz',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-wide text-slate-800">
                Şifre
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-500">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="En az 6 karakter"
                  className={cn(
                    'h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-12 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400',
                    'focus:outline-none focus:ring-4',
                    errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15 bg-red-50/40'
                      : 'border-slate-200 focus:border-[#e30a17] focus:ring-[#e30a17]/15 focus:bg-white',
                  )}
                  {...register('password', {
                    required: 'Şifre zorunludur',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sifreyi gizle' : 'Sifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="group inline-flex cursor-pointer select-none items-center gap-2.5">
                <input
                  type="checkbox"
                  className="size-[18px] rounded-md border-slate-300 text-[#e30a17] shadow-sm transition focus:ring-2 focus:ring-[#e30a17]/30 focus:ring-offset-0"
                  {...register('remember')}
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Beni Hatırla
                </span>
              </label>
              <Link
                to="/sifremi-unuttum"
                className="text-sm font-semibold text-[#e30a17] transition-colors hover:text-[#b40713]"
              >
                Şifremi Unuttum
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#e30a17] text-[15px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(227,10,23,0.6)] transition-all hover:bg-[#c00914] hover:shadow-[0_14px_30px_-10px_rgba(227,10,23,0.7)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {isSubmitting ? (
                <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider + Copyright */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="h-px w-6 bg-slate-200" />
            <span>&copy; 2026 {brand.companyName}</span>
            <span className="h-px w-6 bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="relative z-10 bg-[#0f172a]/80 backdrop-blur-md border-t border-white/10 px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-200">
            &copy; 2026 {brand.companyName}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/kullanim-sartlari"
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Kullanım Şartları
            </Link>
            <Link
              to="/gizlilik-politikasi"
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors"
            >
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
