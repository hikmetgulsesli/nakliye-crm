import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import api from '@/config/api';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* Background: ayni login sayfası ile tutarli nakliye liman fotografi */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/55 to-[#0f172a]/70" />
      <div className="absolute inset-0 bg-[#0f172a]/20" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <Link to="/login" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#e30a17]">
            <span className="material-symbols-outlined text-[22px] text-white">
              local_shipping
            </span>
          </div>
          <span className="text-lg font-bold text-white">Uluslararası Nakliye CRM</span>
        </Link>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          TR
        </span>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-[460px] rounded-[28px] bg-white p-10 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.65)] ring-1 ring-slate-900/5">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e30a17]/10 ring-1 ring-[#e30a17]/15">
              <span className="material-symbols-outlined text-[28px] text-[#e30a17]">
                lock_reset
              </span>
            </div>
          </div>

          <h1 className="text-center text-[28px] font-black leading-tight tracking-tight text-slate-900">
            Şifremi Unuttum
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            E-posta adresinizi girin, şifre sıfırlama linki gönderelim.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              <span className="material-symbols-outlined text-[18px] text-red-500 mt-0.5 shrink-0">
                error
              </span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success */}
          {sent ? (
            <div className="mt-7">
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5 shrink-0">
                  check_circle
                </span>
                <span className="leading-relaxed">
                  Şifre sıfırlama linki e-posta adresinize gönderildi.
                </span>
              </div>
              <Link
                to="/login"
                className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e30a17] text-[15px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(227,10,23,0.6)] transition-all hover:bg-[#c00914] hover:shadow-[0_14px_30px_-10px_rgba(227,10,23,0.7)]"
              >
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
                  arrow_back
                </span>
                <span>Giriş Sayfasına Dön</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#e30a17] text-[15px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(227,10,23,0.6)] transition-all hover:bg-[#c00914] hover:shadow-[0_14px_30px_-10px_rgba(227,10,23,0.7)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>Şifre Sıfırlama Linki Gönder</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                      send
                    </span>
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
                  arrow_back
                </span>
                <span>Giriş Sayfasına Dön</span>
              </Link>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0f172a]/80 backdrop-blur-md border-t border-white/10 px-8 py-4">
        <p className="text-center text-sm text-slate-200">
          &copy; 2026 NakliyeCRM. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
