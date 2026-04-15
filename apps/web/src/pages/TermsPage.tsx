import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Genel Kosullar',
    content: `Bu kullanim sartlari, NakliyeCRM platformunu ("Hizmet") kullanan tum gercek ve tuzel kisiler ("Kullanici") icin gecerlidir. Hizmeti kullanmaya baslayarak bu sartlari kabul etmis sayilirsiniz. NakliyeCRM, bu sartlari onceden bildirimde bulunarak degistirme hakkini sakli tutar. Guncel sartlar her zaman bu sayfadan erisilebilir durumda olacaktir.`,
  },
  {
    title: '2. Hizmet Kullanimi',
    content: `NakliyeCRM, uluslararasi nakliye firmalarina yonelik musteri iliskileri yonetimi, teklif takibi, raporlama ve operasyon yonetimi hizmetleri sunmaktadir. Kullanicilar, hizmeti yalnizca yasalara uygun ve meşru ticari amaclar dogrultusunda kullanmayi taahhut eder. Platform uzerinden gerceklestirilen tum islemler kullanicinin sorumlulugundadir.`,
  },
  {
    title: '3. Kullanici Sorumluluklari',
    content: `Kullanicilar, hesap bilgilerinin gizliligini korumakla yukumludur. Sifrelerin guclu ve benzersiz olmasi, hesap bilgilerinin ucuncu kisilerle paylasilmamasi gerekmektedir. Hesap uzerinden gerceklestirilen tum islemlerden hesap sahibi sorumludur. Yetkisiz erisim tespit edildiginde derhal NakliyeCRM'e bildirimde bulunulmalidir.`,
  },
  {
    title: '4. Gizlilik ve Guvenlik',
    content: `NakliyeCRM, kullanici verilerinin guvenligini en ust duzeyde korumak icin endustri standartlarinda guvenlik onlemleri uygulamaktadir. Veriler sifrelenmis baglantIlar uzerinden iletilir ve guvenli sunucularda saklanir. Detayli bilgi icin Gizlilik Politikamizi inceleyebilirsiniz.`,
  },
  {
    title: '5. Fikri Mulkiyet Haklari',
    content: `NakliyeCRM platformunun tasarimi, kaynak kodu, logosu, icerik ve algoritmalari dahil tum fikri mulkiyet haklari NakliyeCRM'e aittir. Kullanicilar, platformun herhangi bir bolumunu kopyalayamaz, degistiremez, dagitamaz veya tersine muhendislik yapamaz. Platform uzerinden olusturulan veriler kullaniciya ait olmakla birlikte, platformun kendisi uzerinde herhangi bir hak iddia edilemez.`,
  },
  {
    title: '6. Sorumluluk Sinirlamasi',
    content: `NakliyeCRM, hizmetin kesintisiz ve hatasiz calisacagini garanti etmez. Teknik bakim, guncelleme veya olagan disi durumlar nedeniyle hizmet gecici olarak askiya alinabilir. NakliyeCRM, hizmetin kullanimindan kaynaklanan dolayli, ozel veya cezai zararlarden sorumlu tutulamaz. Veri kaybi riskine karsi kullanicilarin duzenli yedekleme yapmasi onerılir.`,
  },
  {
    title: '7. Degisiklikler',
    content: `NakliyeCRM, bu kullanim sartlarini herhangi bir zamanda guncelleme hakkini sakli tutar. Onemli degisiklikler e-posta veya platform ici bildirim yoluyla kullanicilara duyurulacaktir. Degisiklikler yayinlandiktan sonra hizmeti kullanmaya devam etmek, guncellenmis sartlarin kabul edildigi anlamina gelir.`,
  },
  {
    title: '8. Iletisim',
    content: `Bu kullanim sartlariyla ilgili sorulariniz icin info@nakliyecrm.com adresinden veya Iletisim sayfamiz uzerinden bizimle iletisime gecebilirsiniz. Yasal bildirimler icin yazili olarak basuvurmaniz gerekmektedir.`,
  },
];

export default function TermsPage() {
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
          <span className="text-lg font-bold text-white">Uluslararasi Nakliye CRM</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/hakkimizda" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hakkimizda
          </Link>
          <Link to="/hizmetler" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Hizmetler
          </Link>
          <Link to="/iletisim" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Iletisim
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-[#e30a17] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c00914]"
          >
            Giris Yap
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-8 py-12 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#e30a17]/20">
                <span className="material-symbols-outlined text-[40px] text-[#e30a17]">gavel</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white">Kullanim Sartlari</h1>
            <p className="mt-4 text-sm text-slate-400">Son guncelleme: 1 Ocak 2026</p>
          </div>

          <div className="mt-12 space-y-8">
            {sections.map((s) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#e30a17] hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Giris sayfasina don
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1e3a5f] px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">&copy; 2026 NakliyeCRM. Tum haklari saklidir.</p>
          <div className="flex items-center gap-4">
            <Link to="/kullanim-sartlari" className="text-sm text-white transition-colors">
              Kullanim Sartlari
            </Link>
            <Link to="/gizlilik-politikasi" className="text-sm text-slate-400 hover:text-white transition-colors">
              Gizlilik Politikasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
