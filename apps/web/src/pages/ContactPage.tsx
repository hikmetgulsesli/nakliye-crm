import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ad Soyad zorunludur';
    if (!form.email.trim()) errs.email = 'E-posta zorunludur';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta giriniz';
    if (!form.subject.trim()) errs.subject = 'Konu zorunludur';
    if (!form.message.trim()) errs.message = 'Mesaj zorunludur';
    else if (form.message.trim().length < 10) errs.message = 'Mesaj en az 10 karakter olmalıdır';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[e.target.name];
        return next;
      });
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <Link to="/login" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#e30a17]">
            <span className="material-symbols-outlined text-[22px] text-white">local_shipping</span>
          </div>
          <span className="text-lg font-bold text-white">Uluslararası Nakliye CRM</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/hakkimizda" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hakkımızda
          </Link>
          <Link to="/hizmetler" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hizmetler
          </Link>
          <Link to="/iletisim" className="text-sm font-medium text-white transition-colors">
            İletişim
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-[#e30a17] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c00914]"
          >
            Giriş Yap
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-8 py-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          {/* Hero */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#e30a17]/20">
                <span className="material-symbols-outlined text-[40px] text-[#e30a17]">contact_mail</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white lg:text-5xl">İletişim</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Sorulariniz, onerileriniz veya is birligi talepleriniz için bizimle iletisime gecin.
              Ekibimiz en kisa surede size donecektir.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: 'email',
                title: 'E-posta',
                value: 'info@nakliyecrm.com',
                sub: 'Is gunleri 09:00 - 18:00',
              },
              {
                icon: 'phone',
                title: 'Telefon',
                value: '+90 212 555 0000',
                sub: 'Pazartesi - Cuma',
              },
              {
                icon: 'location_on',
                title: 'Adres',
                value: 'Istanbul, Türkiye',
                sub: 'Levent, Besiktas',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#e30a17]/20">
                  <span className="material-symbols-outlined text-[24px] text-[#e30a17]">{c.icon}</span>
                </div>
                <h3 className="font-bold text-white">{c.title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-200">{c.value}</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Contact Form + Map */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white">Bize Yazin</h2>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Formu doldurun, size en kisa surede donelim.</p>

              {submitted && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-3 text-sm text-green-300">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Mesajiniz basariyla gönderildi. En kisa surede size donecegiz.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Ad Soyad</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Adınız ve soyadınız"
                    className={`w-full rounded-xl border bg-white/10 py-3 px-4 text-sm text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-400 focus:ring-red-400/30' : 'border-white/10 focus:ring-[#e30a17]/30'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">E-posta</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="örnek@sirket.com"
                    className={`w-full rounded-xl border bg-white/10 py-3 px-4 text-sm text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-400 focus:ring-red-400/30' : 'border-white/10 focus:ring-[#e30a17]/30'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Konu</label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Mesajinizin konusu"
                    className={`w-full rounded-xl border bg-white/10 py-3 px-4 text-sm text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 ${
                      errors.subject ? 'border-red-400 focus:ring-red-400/30' : 'border-white/10 focus:ring-[#e30a17]/30'
                    }`}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Mesaj</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Mesajinizi buraya yazin..."
                    className={`w-full rounded-xl border bg-white/10 py-3 px-4 text-sm text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 resize-none ${
                      errors.message ? 'border-red-400 focus:ring-red-400/30' : 'border-white/10 focus:ring-[#e30a17]/30'
                    }`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e30a17] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c00914] disabled:opacity-60"
                >
                  {sending ? (
                    <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Mesaj Gönder
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map Placeholder */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="text-center p-8">
                  <span className="material-symbols-outlined text-[64px] text-slate-500 dark:text-slate-400">map</span>
                  <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                    Istanbul, Besiktas, Levent
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Buyukdere Caddesi No:185, 34394
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="font-bold text-white">Calisma Saatleri</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Pazartesi - Cuma</span>
                    <span>09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cumartesi</span>
                    <span>10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 dark:text-slate-500">
                    <span>Pazar</span>
                    <span>Kapali</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1e3a5f] px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400 dark:text-slate-500">&copy; 2026 NakliyeCRM. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link to="/kullanim-sartlari" className="text-sm text-slate-400 dark:text-slate-500 hover:text-white transition-colors">
              Kullanım Şartları
            </Link>
            <Link to="/gizlilik-politikasi" className="text-sm text-slate-400 dark:text-slate-500 hover:text-white transition-colors">
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
