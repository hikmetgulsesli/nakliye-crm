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
        axiosErr.response?.data?.message || 'Bir hata olustu. Lutfen tekrar deneyin.',
      );
    }
  };

  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}
    >
      {/* Background: ayni login sayfasi ile tutarli nakliye liman fotografi */}
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
          <span className="text-lg font-bold text-white">Uluslararasi Nakliye CRM</span>
        </Link>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          TR
        </span>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-[480px] rounded-2xl border border-white/20 bg-[#fdfbf8]/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#e30a17]/10">
              <span className="material-symbols-outlined text-[28px] text-[#e30a17]">
                lock_reset
              </span>
            </div>
          </div>

          <h1 className="text-center text-3xl font-black text-slate-900 dark:text-slate-100">Sifremi Unuttum</h1>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            E-posta adresinizi girin, sifre sifirlama linki gonderelim.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Success */}
          {sent ? (
            <div className="mt-6">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Sifre sifirlama linki e-posta adresinize gonderildi.
              </div>
              <Link
                to="/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e30a17] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c00914]"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Giris Sayfasina Don
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 dark:text-slate-500">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder="ornek@sirket.com"
                    className={cn(
                      'w-full rounded-xl border bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 focus:outline-none focus:ring-2',
                      errors.email
                        ? 'border-red-300 focus:ring-red-300'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-[#e30a17]/30',
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e30a17] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c00914] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Sifre Sifirlama Linki Gonder
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:bg-slate-800/60"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Giris Sayfasina Don
              </Link>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0f172a]/80 backdrop-blur-md border-t border-white/10 px-8 py-4">
        <p className="text-center text-sm text-slate-200">
          &copy; 2026 NakliyeCRM. Tum haklari saklidir.
        </p>
      </footer>
    </div>
  );
}
