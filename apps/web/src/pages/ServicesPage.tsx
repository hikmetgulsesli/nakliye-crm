import { Link } from 'react-router-dom';

const services = [
  {
    icon: 'groups',
    title: 'Müşteri Iliskileri Yönetimi',
    desc: 'Tüm musterilerinizi tek bir platformda yönetin. Detayli müşteri profilleri, iletişim geçmişi, notlar ve hatirlatmalar ile müşteri iliskilerinizi guclendirin. Müşteri segmentasyonu ve onceliklendirme ozellikleri sayesinde en degerli musterilerinize odaklanin.',
  },
  {
    icon: 'request_quote',
    title: 'Teklif ve Fiyatlandirma',
    desc: 'Otomatik teklif numaralama sistemi ile profesyonel teklifler olusturun. Revize takibi, onay surecleri ve teklif geçmişi ile sureci uctan uca yönetin. Farkli nakliye turlerine gore fiyatlandirma sablonlari ile hızlı ve tutarli teklifler hazirlayin.',
  },
  {
    icon: 'local_shipping',
    title: 'Lojistik Operasyon Takibi',
    desc: 'Deniz, hava ve kara tasimaciliginda operasyonlarinizi takip edin. Yukun çıkış noktasindan varış noktasina kadar tüm sureci izleyin. Konteyner, parsiyel ve komple yukleme secenekleri ile esnek operasyon yönetimi saglayin.',
  },
  {
    icon: 'assessment',
    title: 'Raporlama ve Analiz',
    desc: 'Kapsamli raporlama araclari ile isletmenizin performansini olcun. PDF ve Excel formatinda raporlar olusturun. Satış trendleri, müşteri analizleri ve temsilci performansı gibi kritik metrikleri gorsellestirin.',
  },
  {
    icon: 'supervisor_account',
    title: 'Ekip Yönetimi',
    desc: 'Satış temsilcilerinize müşteri ve teklif atamasi yapın. Devir işlemleri ile calisanlarin ayrilis sureclerini sorunsuz yönetin. Ekip bazli performans raporlari ile verimlilik takibi yapın.',
  },
  {
    icon: 'security',
    title: 'Guvenlik ve Denetim',
    desc: 'Iki faktorlu dogrulama (2FA) ile hesap guvenligini artirin. Rol bazli erisim kontrolu (RBAC) sayesinde her kullanicinin sadece yetkili oldugu alanlara erismesini saglayin. Kapsamli denetim kayitlari ile tüm işlemleri takip edin.',
  },
];

export default function ServicesPage() {
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
          <Link to="/hizmetler" className="text-sm font-medium text-white transition-colors">
            Hizmetler
          </Link>
          <Link to="/iletisim" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
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
                <span className="material-symbols-outlined text-[40px] text-[#e30a17]">miscellaneous_services</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white lg:text-5xl">Hizmetlerimiz</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              NakliyeCRM, uluslararası nakliye firmalari için ozel olarak tasarlanmis kapsamli çözümler sunar.
              Isletmenizin her ihtiyacina yonelik profesyonel araclarla verimliligini artirin.
            </p>
          </div>

          {/* Service Cards */}
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-[#e30a17]/20">
                  <span className="material-symbols-outlined text-[28px] text-[#e30a17]">{s.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400 dark:text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-lg text-slate-300">
              Hemen baslayin ve isletmenizin potansiyelini kesfedin.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e30a17] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c00914]"
            >
              Giriş Yap
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
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
