import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
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
        axiosErr.response?.data?.message || 'Giris basarisiz. Bilgilerinizi kontrol ediniz.',
      );
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#0f172a]" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#e30a17]">
            <span className="material-symbols-outlined text-[22px] text-white">
              local_shipping
            </span>
          </div>
          <span className="text-lg font-bold text-white">Uluslararasi Nakliye CRM</span>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-white/80 transition-colors hover:text-white">
            Hakkimizda
          </a>
          <a href="#" className="text-sm text-white/80 transition-colors hover:text-white">
            Hizmetler
          </a>
          <a href="#" className="text-sm text-white/80 transition-colors hover:text-white">
            Iletisim
          </a>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            TR
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-end px-8 py-12 lg:px-24">
        {/* Login Card */}
        <div className="w-full max-w-[480px] rounded-2xl border border-white/20 bg-[#fdfbf8]/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Globe Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#e30a17]/10">
              <span className="material-symbols-outlined text-[28px] text-[#e30a17]">
                public
              </span>
            </div>
          </div>

          <h1 className="text-center text-3xl font-black text-slate-900">Hos Geldiniz</h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Devam etmek icin hesabiniza giris yapin
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                  person
                </span>
                <input
                  type="email"
                  placeholder="ornek@sirket.com"
                  className={cn(
                    'w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
                    errors.email
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-[#e30a17]/30',
                  )}
                  {...register('email', {
                    required: 'E-posta adresi zorunludur',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Gecerli bir e-posta adresi giriniz',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Sifre</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sifrenizi giriniz"
                  className={cn(
                    'w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2',
                    errors.password
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-[#e30a17]/30',
                  )}
                  {...register('password', {
                    required: 'Sifre zorunludur',
                    minLength: {
                      value: 6,
                      message: 'Sifre en az 6 karakter olmalidir',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-[#e30a17] focus:ring-[#e30a17]/30"
                  {...register('remember')}
                />
                Beni Hatirla
              </label>
              <a href="#" className="text-sm font-medium text-[#e30a17] hover:text-[#c00914]">
                Sifremi Unuttum
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e30a17] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c00914] disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Giris Yap
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Terms Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Giris yaparak{' '}
            <a href="#" className="text-[#e30a17] hover:underline">
              Kullanim Sartlari
            </a>{' '}
            ve{' '}
            <a href="#" className="text-[#e30a17] hover:underline">
              Gizlilik Politikasi
            </a>
            &apos;ni kabul etmis olursunuz.
          </p>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="relative z-10 bg-[#1e3a5f] px-8 py-4">
        <p className="text-center text-sm text-slate-400">
          &copy; 2026 NakliyeCRM. Tum haklari saklidir.
        </p>
      </footer>
    </div>
  );
}
