import { Link, useNavigate } from 'react-router-dom';
import { Icon, Button } from '@/components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark flex flex-col">
      {/* Top Nav */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="local_shipping" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
              Logistics CRM
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/teklifler"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              Teklifler
            </Link>
            <Link
              to="/musteriler"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              Müşteriler
            </Link>
            <Link
              to="/raporlar"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              Raporlar
            </Link>
          </nav>
        </div>

        {/* User avatar */}
        <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
          ?
        </div>
      </header>

      {/* Centered 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Large "?" icon in circle */}
          <div className="mx-auto mb-8 size-32 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center">
            <Icon
              name="help"
              className="text-slate-400 dark:text-slate-500"
              size="xl"
            />
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold font-display text-slate-900 dark:text-slate-100 mb-3">
            Sayfa Bulunamadı
          </h1>

          {/* Subtitle */}
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
            Aradiginiz sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
            Lütfen URL adresini kontrol edin veya ana sayfaya dönün.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button icon="home" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </Button>
            <Button
              variant="secondary"
              icon="arrow_back"
              onClick={() => navigate(-1)}
            >
              Geri Git
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Logistics CRM. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
