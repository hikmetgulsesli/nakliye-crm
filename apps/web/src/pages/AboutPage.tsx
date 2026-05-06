import { Link } from 'react-router-dom';

export default function AboutPage() {
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
          <Link to="/hakkimizda" className="text-sm font-medium text-white transition-colors">
            Hakkımızda
          </Link>
          <Link to="/hizmetler" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
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
        {/* Hero */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-[#e30a17]/20">
              <span className="material-symbols-outlined text-[40px] text-[#e30a17]">public</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white lg:text-5xl">Hakkımızda</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Uluslararası Nakliye CRM, lojistik sektorunde faaliyet gosteren firmalarin müşteri, teklif ve
            operasyon yonetimini kolaylastiran modern bir web uygulamasidir. Sektorun ihtiyaclarina ozel
            gelistirilmis cozumlerimizle isletmenizin verimliligini artiriyoruz.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#e30a17]/20">
              <span className="material-symbols-outlined text-[24px] text-[#e30a17]">flag</span>
            </div>
            <h2 className="text-xl font-bold text-white">Misyonumuz</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Lojistik sektorundeki firmalara, müşteri iliskilerini guclendiren, operasyonel surecleri
              hizlandiran ve karliligi artiran teknolojik çözümler sunmak. Her olcekteki nakliye firmasinin
              dijital donusumune onculuk ederek sektorun rekabet gucunu artirmayi hedefliyoruz.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#e30a17]/20">
              <span className="material-symbols-outlined text-[24px] text-[#e30a17]">visibility</span>
            </div>
            <h2 className="text-xl font-bold text-white">Vizyonumuz</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Türkiye ve bolge ulkelerinde uluslararası nakliye sektorunun en cok tercih edilen CRM platformu
              olmak. Yapay zeka destekli analizler, otomatik surec yönetimi ve entegre lojistik cozumleriyle
              sektorun dijital gelecegini sekillendiriyoruz.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-white">Neden NakliyeCRM?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: 'groups',
                title: 'Müşteri Yönetimi',
                desc: 'Tüm müşteri bilgilerinizi tek bir merkezde yönetin. İletişim geçmişi, teklif takibi ve notlar ile eksiksiz müşteri profilleri olusturun.',
              },
              {
                icon: 'request_quote',
                title: 'Teklif Takibi',
                desc: 'Otomatik teklif numaralama, revize takibi ve onay surecleri ile profesyonel teklif yönetimi. PDF ve Excel formatinda cikti alin.',
              },
              {
                icon: 'analytics',
                title: 'Performans Analizi',
                desc: 'Detayli raporlar ve gorsellestirmeler ile satış performansinizi takip edin. Dönemsel karsilastirmalar ve trend analizleri yapın.',
              },
              {
                icon: 'shield',
                title: 'Guvenilir Altyapi',
                desc: 'Iki faktorlu dogrulama, rol bazli erisim kontrolu ve kapsamli denetim kayitlari ile verileriniz guvende.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-[#e30a17]/20">
                  <span className="material-symbols-outlined text-[22px] text-[#e30a17]">{f.icon}</span>
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400 dark:text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white">Ekibimiz</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
            NakliyeCRM, lojistik sektorunde uzun yillar deneyime sahip profesyoneller ve yazilim
            mühendislerinden oluşan bir ekip tarafından geliştirilmektedir. İstanbul merkezli ekibimiz,
            sektörün ihtiyaçlarını yakından takip ederek sürekli yenilikçi çözümler üretmektedir.
            Müşterilerimize 7/24 teknik destek ve danışmanlık hizmeti sunuyoruz.
          </p>
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
