import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Veri Toplama ve Kullanım',
    content: `NakliyeCRM, hizmetlerini sunabilmek için kullanicilardan cesitli kisisel veriler toplamaktadir. Bu veriler arasinda ad, soyad, e-posta adresi, telefon numarasi, sirket bilgileri ve kullanım verileri yer almaktadir. Toplanan veriler yalnizca hizmetin iyilestirilmesi, kullanıcı deneyiminin kisisellestirilmesi ve yasal yukumluluklerin yerine getirilmesi amaciyla kullanilmaktadir.`,
  },
  {
    title: '2. Kisisel Verilerin Korunmasi',
    content: `NakliyeCRM, 6698 sayili Kisisel Verilerin Korunmasi Kanunu (KVKK) ve ilgili mevzuat kapsamında veri sorumlusu sifatiyla hareket etmektedir. Kisisel verileriniz, hukuka ve dururstluk kurallarina uygun sekilde, belirli, açık ve mesru amaclar dogrultusunda islenmektedir. Verilerin islenmesinde olcululiuk ilkesine uyulmakta ve gerekli olmayan veriler toplanmamaktadir.`,
  },
  {
    title: '3. Cerez Politikası',
    content: `NakliyeCRM, kullanıcı deneyimini iyilestirmek ve platform performansini analiz etmek için cerezler kullanmaktadir. Zorunlu cerezler platformun temel islevlerinin calismasi için gereklidir ve devre disi birakilamaz. Analitik cerezler, kullanım istatistiklerini toplamak için kullanilir ve tercih cerezleri kullanıcı ayarlarini saklar. Cerez tercihlerinizi tarayici ayarlarinizdan yonetebilirsiniz.`,
  },
  {
    title: '4. Ucuncu Taraf Paylasimi',
    content: `NakliyeCRM, kullanıcı verilerini açık rizaniz olmadan ucuncu taraflarla paylasmaz. Ancak yasal zorunluluklar gerektirdiginde, yetkili kamu kurum ve kuruluslariyla veri paylasimi yapilabilir. Hizmet saglayicilarimiz (hosting, e-posta, analitik) ile paylasilan veriler, gizlilik sozlesmeleri kapsamında korunmaktadir. Verileriniz yurt disina aktarilmamaktadir.`,
  },
  {
    title: '5. Veri Saklama Süresi',
    content: `Kisisel verileriniz, isleme amacinin gerektirdigi sure boyunca saklanmaktadir. Hesabinizi kapattiginizda, verileriniz yasal saklama yukululukleri haric olmak uzere 90 gün icinde silinir. Ticari kayıtlar ve fatura bilgileri, yasal zorunluluklar geregi 10 yil sureyle saklanmaktadir. Denetim kayitlari guvenlik amaciyla 2 yil sureyle muhafaza edilmektedir.`,
  },
  {
    title: '6. Kullanıcı Hakları (KVKK Kapsamında)',
    content: `KVKK\'nin 11. maddesi kapsamında asagidaki haklara sahipsiniz: Kisisel verilerinizin islenip islenmedigini ogrenme, islenmisse buna iliskin bilgi talep etme, isleme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme, yurt icinde veya yurt disinda aktarildigu ucuncu kisileri bilme, eksik veya yanlis islenmisse duzeltilmesini isteme, KVKK\'nin 7. maddesinde ongourulen sartlar cercevesinde silinmesini veya yok edilmesini isteme, ve islenen verilerin munhasiran otomatik sistemler vasitasiyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya cikmasina itiraz etme.`,
  },
  {
    title: '7. Guvenlik Onlemleri',
    content: `NakliyeCRM, verilerinizin guvenligini saglamak için endustri standartlarinda teknik ve idari onlemler uygulamaktadir. Tüm veri iletimi SSL/TLS sifreleme ile korunmaktadir. Veritabani sifreleme, duzenli guvenlik taramalari ve penetrasyon testleri uygulanmaktadir. Erisim kontrolleri ve iki faktorlu dogrulama ile yetkisiz erisim engellenmektedir. Duzenli yedekleme ve felaket kurtarma planlari mevcuttur.`,
  },
  {
    title: '8. İletişim',
    content: `Gizlilik politikamiz hakkinda sorulariniz veya KVKK kapsamindaki haklarinizi kullanmak için info@nakliyecrm.com adresine e-posta gonderebilir veya İletişim sayfamiz uzerinden bizimle iletisime gecebilirsiniz. KVKK basuvurulari için yazili olarak veya kayıtlı elektronik posta (KEP) adresi uzerinden basvurmaniz gerekmektedir. Basvurulariniz en gec 30 gün icinde ucretsiz olarak sonuclandirilacaktir.`,
  },
];

export default function PrivacyPage() {
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
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-[#e30a17]/20">
                <span className="material-symbols-outlined text-[40px] text-[#e30a17]">policy</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white">Gizlilik Politikası</h1>
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">Son güncelleme: 1 Ocak 2026</p>
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
              Giriş sayfasına don
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
            <Link to="/gizlilik-politikasi" className="text-sm text-white transition-colors">
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
