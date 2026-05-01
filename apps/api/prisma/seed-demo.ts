/**
 * Demo veri seed'i — dashboard / liste görünümlerini gerçekçi senaryolarla doldurur.
 * Idempotent: müşteriler companyName, teklifler customerId+quoteDate+price üzerinden
 * findFirst ile eşleştirilir, varsa atlanır. Tekrar çalıştırmak güvenlidir.
 *
 * Çalıştırmak için: bun run db:seed:demo
 */
import { prisma } from '../src/config/database';

type SeedUser = { id: number; fullName: string };

interface CustomerSpec {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  transportModes: string[];
  serviceTypes: string[];
  incoterms: string[];
  direction: 'İthalat' | 'İhracat' | 'Çapraz Ticaret';
  originCountries: string[];
  destinationCountries: string[];
  source: string;
  potential: 'Yüksek' | 'Orta' | 'Düşük';
  status: 'Aktif' | 'Pasif' | 'Soğuk';
  notes: string;
  assignedTo: 'ahmet' | 'ayse' | 'mehmet';
  /** Bugünden geriye gün sayısı — son iletişim tarihi için. */
  lastContactDaysAgo: number;
  quotes: QuoteSpec[];
  activities: ActivitySpec[];
}

interface QuoteSpec {
  daysAgo: number;
  validityDays: number;
  transportMode: string;
  serviceType: string;
  originCountry: string;
  pol: string;
  destinationCountry: string;
  pod: string;
  incoterm: string;
  price: number;
  currency: 'USD' | 'EUR' | 'TRY';
  status: 'Bekliyor' | 'Kazanıldı' | 'Kaybedildi' | 'İptal';
  lossReason?: string;
  priceNote?: string;
  /** Teklif "Kazanıldı" ise sevkiyat oluşturulur. */
  shipmentStatus?: 'booked' | 'in_transit' | 'arrived' | 'delivered';
}

interface ActivitySpec {
  daysAgo: number;
  activityType: 'Telefon' | 'E-posta' | 'Yüz Yüze' | 'Video Görüşme';
  durationMinutes?: number;
  notes: string;
  outcome: 'Olumlu' | 'Nötr' | 'Olumsuz' | 'Teklif İstendi';
  /** İleride yapılacak iş için tetik tarihi (gün cinsinden, pozitif=ileri). */
  nextActionDays?: number;
  /** Hangi kullanıcı oluşturmuş — boş bırakılırsa müşterinin sahibi. */
  byUser?: 'ahmet' | 'ayse' | 'mehmet' | 'admin';
}

const customers: CustomerSpec[] = [
  {
    companyName: 'Aksel Lojistik A.Ş.',
    contactName: 'Mert Aydın',
    phone: '+902124441010',
    email: 'mert.aydin@aksellojistik.com',
    address: 'Kemankeş Mah. Rıhtım Cd. No:14 Karaköy/İstanbul',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Komple'],
    incoterms: ['FOB', 'CIF'],
    direction: 'İthalat',
    originCountries: ['Çin', 'Almanya'],
    destinationCountries: ['Türkiye'],
    source: 'Referans',
    potential: 'Yüksek',
    status: 'Aktif',
    notes: 'Ayda ortalama 6 konteyner. Fiyat hassas, vade önemli.',
    assignedTo: 'ahmet',
    lastContactDaysAgo: 3,
    quotes: [
      {
        daysAgo: 12,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Çin',
        pol: 'Shanghai',
        destinationCountry: 'Türkiye',
        pod: 'Ambarlı',
        incoterm: 'FOB',
        price: 3850,
        currency: 'USD',
        status: 'Kazanıldı',
        priceNote: '40\' HC konteyner başına. THC dahil.',
        shipmentStatus: 'in_transit',
      },
      {
        daysAgo: 45,
        validityDays: 30,
        transportMode: 'Kara',
        serviceType: 'Komple',
        originCountry: 'Almanya',
        pol: 'Hamburg',
        destinationCountry: 'Türkiye',
        pod: 'İzmir',
        incoterm: 'DAP',
        price: 2950,
        currency: 'EUR',
        status: 'Kazanıldı',
        shipmentStatus: 'delivered',
      },
      {
        daysAgo: 5,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Çin',
        pol: 'Ningbo',
        destinationCountry: 'Türkiye',
        pod: 'Mersin',
        incoterm: 'FOB',
        price: 4100,
        currency: 'USD',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 3,
        activityType: 'Telefon',
        durationMinutes: 18,
        notes: 'Yeni kontenjanlar için fiyat istedi. Ningbo-Mersin teklifi gönderildi.',
        outcome: 'Teklif İstendi',
        nextActionDays: 4,
      },
      {
        daysAgo: 14,
        activityType: 'E-posta',
        notes: 'Shanghai-Ambarlı booking onayı iletildi.',
        outcome: 'Olumlu',
      },
    ],
  },
  {
    companyName: 'Marmara Tekstil San. ve Tic. Ltd.',
    contactName: 'Selin Tunç',
    phone: '+902128889090',
    email: 'selin@marmaratekstil.com.tr',
    address: 'Çerkezköy OSB. 5. Cd. No:42 Tekirdağ',
    transportModes: ['Deniz', 'Hava'],
    serviceTypes: ['LCL', 'Parsiyel'],
    incoterms: ['EXW', 'FCA'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['ABD', 'İngiltere'],
    source: 'Fuar',
    potential: 'Yüksek',
    status: 'Aktif',
    notes: 'Sezon başlamadan ciddi hacim artışı bekleniyor.',
    assignedTo: 'ayse',
    lastContactDaysAgo: 1,
    quotes: [
      {
        daysAgo: 21,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'LCL',
        originCountry: 'Türkiye',
        pol: 'Ambarlı',
        destinationCountry: 'ABD',
        pod: 'New York',
        incoterm: 'FCA',
        price: 2400,
        currency: 'USD',
        status: 'Kazanıldı',
        shipmentStatus: 'arrived',
      },
      {
        daysAgo: 8,
        validityDays: 21,
        transportMode: 'Hava',
        serviceType: 'Parsiyel',
        originCountry: 'Türkiye',
        pol: 'IST',
        destinationCountry: 'İngiltere',
        pod: 'LHR',
        incoterm: 'EXW',
        price: 5.85,
        currency: 'USD',
        priceNote: 'kg başına, min 200kg',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 1,
        activityType: 'Yüz Yüze',
        durationMinutes: 75,
        notes: 'Ofiste toplantı. AB pazarına genişleme planı paylaşıldı.',
        outcome: 'Olumlu',
        nextActionDays: 7,
      },
      {
        daysAgo: 9,
        activityType: 'E-posta',
        notes: 'IST-LHR hava kargo teklifi gönderildi.',
        outcome: 'Teklif İstendi',
      },
    ],
  },
  {
    companyName: 'Anadolu Otomotiv Yedek Parça',
    contactName: 'Burak Eren',
    phone: '+902323337070',
    email: 'burak.eren@anadoluparca.com',
    address: 'Kemalpaşa OSB. 12. Sk. No:8 İzmir',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Komple'],
    incoterms: ['CIF', 'DAP'],
    direction: 'İthalat',
    originCountries: ['Almanya', 'İtalya'],
    destinationCountries: ['Türkiye'],
    source: 'Soğuk arama',
    potential: 'Orta',
    status: 'Aktif',
    notes: 'Mevcut taşıyıcısından memnuniyetsiz. Hassas zamanlama.',
    assignedTo: 'mehmet',
    lastContactDaysAgo: 6,
    quotes: [
      {
        daysAgo: 30,
        validityDays: 30,
        transportMode: 'Kara',
        serviceType: 'Komple',
        originCountry: 'İtalya',
        pol: 'Milano',
        destinationCountry: 'Türkiye',
        pod: 'İzmir',
        incoterm: 'DAP',
        price: 3450,
        currency: 'EUR',
        status: 'Kaybedildi',
        lossReason: 'Fiyat',
      },
      {
        daysAgo: 7,
        validityDays: 21,
        transportMode: 'Kara',
        serviceType: 'Komple',
        originCountry: 'Almanya',
        pol: 'Münih',
        destinationCountry: 'Türkiye',
        pod: 'İzmir',
        incoterm: 'DAP',
        price: 2780,
        currency: 'EUR',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 6,
        activityType: 'Telefon',
        durationMinutes: 25,
        notes: 'Münih-İzmir aciliyeti var. Hızlı dönüş istendi.',
        outcome: 'Teklif İstendi',
        nextActionDays: 1,
      },
      {
        daysAgo: 32,
        activityType: 'Telefon',
        durationMinutes: 12,
        notes: 'Milano teklifinden vazgeçtiklerini bildirdi.',
        outcome: 'Olumsuz',
      },
    ],
  },
  {
    companyName: 'Ege İhracat ve Pazarlama',
    contactName: 'Ceyda Yılmaz',
    phone: '+902325551212',
    email: 'ceyda@egeihracat.com',
    address: 'Atatürk OSB. 10010 Sk. No:5 İzmir',
    transportModes: ['Deniz'],
    serviceTypes: ['FCL', 'LCL'],
    incoterms: ['FOB', 'CFR'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['ABD', 'İngiltere', 'Hollanda'],
    source: 'Referans',
    potential: 'Yüksek',
    status: 'Aktif',
    notes: 'Yıllık 80+ FCL hacim. Stratejik müşteri adayı.',
    assignedTo: 'ayse',
    lastContactDaysAgo: 4,
    quotes: [
      {
        daysAgo: 60,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'İzmir',
        destinationCountry: 'Hollanda',
        pod: 'Rotterdam',
        incoterm: 'CFR',
        price: 1980,
        currency: 'USD',
        status: 'Kazanıldı',
        shipmentStatus: 'delivered',
      },
      {
        daysAgo: 14,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'İzmir',
        destinationCountry: 'ABD',
        pod: 'Houston',
        incoterm: 'FOB',
        price: 2650,
        currency: 'USD',
        status: 'Kazanıldı',
        shipmentStatus: 'in_transit',
      },
      {
        daysAgo: 2,
        validityDays: 21,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'İzmir',
        destinationCountry: 'İngiltere',
        pod: 'Felixstowe',
        incoterm: 'CFR',
        price: 2150,
        currency: 'USD',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 4,
        activityType: 'Video Görüşme',
        durationMinutes: 45,
        notes: 'Q3 hacim planlaması. Felixstowe rotası için fiyat talep ettiler.',
        outcome: 'Teklif İstendi',
        nextActionDays: 3,
      },
      {
        daysAgo: 16,
        activityType: 'E-posta',
        notes: 'Houston booking onayı.',
        outcome: 'Olumlu',
      },
    ],
  },
  {
    companyName: 'Bosphorus Gıda Sanayi',
    contactName: 'Hakan Demir',
    phone: '+902162223344',
    email: 'h.demir@bosphorusgida.com',
    address: 'Tuzla OSB. 4. Cd. No:11 İstanbul',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Komple'],
    incoterms: ['FOB', 'DAP'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['Almanya', 'Fransa'],
    source: 'Dijital',
    potential: 'Orta',
    status: 'Aktif',
    notes: 'Soğuk zincir ürünleri. Reefer konteyner gerektirir.',
    assignedTo: 'mehmet',
    lastContactDaysAgo: 11,
    quotes: [
      {
        daysAgo: 18,
        validityDays: 21,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'Ambarlı',
        destinationCountry: 'Fransa',
        pod: 'Marsilya',
        incoterm: 'FOB',
        price: 4250,
        currency: 'EUR',
        priceNote: 'Reefer 40\'',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 11,
        activityType: 'Telefon',
        durationMinutes: 22,
        notes: 'Reefer kapsama detayları konuşuldu, teklif istendi.',
        outcome: 'Teklif İstendi',
      },
    ],
  },
  {
    companyName: 'KuzeyTech Elektronik',
    contactName: 'İrem Şahin',
    phone: '+903124445566',
    email: 'irem.sahin@kuzeytech.com.tr',
    address: 'ODTÜ Teknokent Galyum Blok Ankara',
    transportModes: ['Hava'],
    serviceTypes: ['Parsiyel'],
    incoterms: ['EXW', 'FCA'],
    direction: 'İthalat',
    originCountries: ['Çin'],
    destinationCountries: ['Türkiye'],
    source: 'Dijital',
    potential: 'Düşük',
    status: 'Aktif',
    notes: 'Düşük hacim, yüksek değerli kargo. Sigorta önemli.',
    assignedTo: 'ahmet',
    lastContactDaysAgo: 22,
    quotes: [
      {
        daysAgo: 25,
        validityDays: 21,
        transportMode: 'Hava',
        serviceType: 'Parsiyel',
        originCountry: 'Çin',
        pol: 'PVG',
        destinationCountry: 'Türkiye',
        pod: 'IST',
        incoterm: 'FCA',
        price: 6.2,
        currency: 'USD',
        priceNote: 'kg başına',
        status: 'Kaybedildi',
        lossReason: 'Rakip',
      },
    ],
    activities: [
      {
        daysAgo: 22,
        activityType: 'E-posta',
        notes: 'Rakipten daha iyi teklif aldıklarını bildirdiler.',
        outcome: 'Olumsuz',
      },
    ],
  },
  {
    companyName: 'Gediz Mobilya İth. İhr.',
    contactName: 'Onur Kara',
    phone: '+902329997788',
    email: 'onur@gedizmobilya.com',
    address: 'İnegöl OSB. 8. Cd. No:21 Bursa',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Parsiyel'],
    incoterms: ['FOB', 'EXW'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['Almanya', 'Fransa', 'Hollanda'],
    source: 'Fuar',
    potential: 'Orta',
    status: 'Aktif',
    notes: 'Mobilya ihracatı, hacim sezona göre değişken.',
    assignedTo: 'ayse',
    lastContactDaysAgo: 9,
    quotes: [
      {
        daysAgo: 40,
        validityDays: 30,
        transportMode: 'Kara',
        serviceType: 'Komple',
        originCountry: 'Türkiye',
        pol: 'Bursa',
        destinationCountry: 'Almanya',
        pod: 'Berlin',
        incoterm: 'EXW',
        price: 3100,
        currency: 'EUR',
        status: 'Kazanıldı',
        shipmentStatus: 'delivered',
      },
      {
        daysAgo: 9,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'Gemlik',
        destinationCountry: 'Hollanda',
        pod: 'Rotterdam',
        incoterm: 'FOB',
        price: 2280,
        currency: 'USD',
        status: 'Bekliyor',
      },
    ],
    activities: [
      {
        daysAgo: 9,
        activityType: 'Telefon',
        durationMinutes: 14,
        notes: 'Yeni mağaza açılışı için Hollanda sevkiyatı planlanıyor.',
        outcome: 'Teklif İstendi',
        nextActionDays: 2,
      },
    ],
  },
  {
    companyName: 'Doğa Kimya Sanayi A.Ş.',
    contactName: 'Yasemin Ak',
    phone: '+903123334455',
    email: 'yasemin@dogakimya.com',
    address: 'Ostim OSB. 1. Cd. No:88 Ankara',
    transportModes: ['Kara'],
    serviceTypes: ['Komple'],
    incoterms: ['DAP', 'CIF'],
    direction: 'İthalat',
    originCountries: ['Almanya', 'İtalya'],
    destinationCountries: ['Türkiye'],
    source: 'Referans',
    potential: 'Düşük',
    status: 'Soğuk',
    notes: 'IMO sınıfı tehlikeli madde. Özel evrak ve onay gerekiyor.',
    assignedTo: 'mehmet',
    lastContactDaysAgo: 75,
    quotes: [],
    activities: [
      {
        daysAgo: 75,
        activityType: 'E-posta',
        notes: 'IMO 6.1 ürün için evrak listesi gönderildi, geri dönüş yok.',
        outcome: 'Nötr',
      },
    ],
  },
  {
    companyName: 'Trakya Tarım Ürünleri',
    contactName: 'Volkan Türk',
    phone: '+902826669090',
    email: 'volkan@trakyatarim.com',
    address: 'Edirne Merkez Çiftlik Yolu No:4',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Bulk'],
    incoterms: ['FOB', 'CFR'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['İtalya', 'İspanya'],
    source: 'Soğuk arama',
    potential: 'Orta',
    status: 'Pasif',
    notes: 'Hasat sezonu yoğun, ara dönem sakin.',
    assignedTo: 'ahmet',
    lastContactDaysAgo: 38,
    quotes: [
      {
        daysAgo: 50,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Türkiye',
        pol: 'Tekirdağ',
        destinationCountry: 'İspanya',
        pod: 'Valencia',
        incoterm: 'CFR',
        price: 1850,
        currency: 'USD',
        status: 'İptal',
      },
    ],
    activities: [
      {
        daysAgo: 38,
        activityType: 'Telefon',
        durationMinutes: 8,
        notes: 'Sezon kapandı, sonbaharda tekrar görüşülecek.',
        outcome: 'Nötr',
      },
    ],
  },
  {
    companyName: 'Akdeniz İnşaat Malzemeleri',
    contactName: 'Cem Polat',
    phone: '+902423332211',
    email: 'cem.polat@akdenizinsaat.com',
    address: 'Antalya Serbest Bölge No:12',
    transportModes: ['Deniz', 'Kara'],
    serviceTypes: ['FCL', 'Komple'],
    incoterms: ['FOB', 'DAP'],
    direction: 'Çapraz Ticaret',
    originCountries: ['Çin'],
    destinationCountries: ['Almanya', 'İngiltere'],
    source: 'Referans',
    potential: 'Yüksek',
    status: 'Aktif',
    notes: 'Çapraz ticaret, doğrudan Çin-AB rotası. Antrepo gerekmiyor.',
    assignedTo: 'ayse',
    lastContactDaysAgo: 2,
    quotes: [
      {
        daysAgo: 4,
        validityDays: 21,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Çin',
        pol: 'Shenzhen',
        destinationCountry: 'Almanya',
        pod: 'Hamburg',
        incoterm: 'FOB',
        price: 4350,
        currency: 'USD',
        priceNote: '40\' HC, transit 32 gün',
        status: 'Bekliyor',
      },
      {
        daysAgo: 28,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'FCL',
        originCountry: 'Çin',
        pol: 'Shanghai',
        destinationCountry: 'İngiltere',
        pod: 'Felixstowe',
        incoterm: 'FOB',
        price: 4520,
        currency: 'USD',
        status: 'Kazanıldı',
        shipmentStatus: 'in_transit',
      },
    ],
    activities: [
      {
        daysAgo: 2,
        activityType: 'Yüz Yüze',
        durationMinutes: 60,
        notes: 'Yeni proje için 5 farklı destinasyon konuşuldu.',
        outcome: 'Olumlu',
        nextActionDays: 5,
      },
    ],
  },
  {
    companyName: 'Karadeniz Demir Çelik',
    contactName: 'Tunç Bayrak',
    phone: '+904624445566',
    email: 'tunc@karadenizcelik.com',
    address: 'Trabzon Sanayi Sitesi No:33',
    transportModes: ['Deniz'],
    serviceTypes: ['Bulk', 'FCL'],
    incoterms: ['FOB', 'CFR'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['ABD', 'İngiltere', 'İspanya'],
    source: 'Fuar',
    potential: 'Yüksek',
    status: 'Aktif',
    notes: 'Aylık 3-4 bulk gemisi. Vergi indirimi mektup bekleniyor.',
    assignedTo: 'mehmet',
    lastContactDaysAgo: 7,
    quotes: [
      {
        daysAgo: 12,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'Bulk',
        originCountry: 'Türkiye',
        pol: 'Trabzon',
        destinationCountry: 'İspanya',
        pod: 'Bilbao',
        incoterm: 'CFR',
        price: 28,
        currency: 'USD',
        priceNote: 'ton başına',
        status: 'Kazanıldı',
        shipmentStatus: 'booked',
      },
      {
        daysAgo: 70,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'Bulk',
        originCountry: 'Türkiye',
        pol: 'Trabzon',
        destinationCountry: 'ABD',
        pod: 'Houston',
        incoterm: 'FOB',
        price: 32,
        currency: 'USD',
        priceNote: 'ton başına',
        status: 'Kazanıldı',
        shipmentStatus: 'delivered',
      },
    ],
    activities: [
      {
        daysAgo: 7,
        activityType: 'E-posta',
        notes: 'Bilbao yükleme planı paylaşıldı.',
        outcome: 'Olumlu',
      },
    ],
  },
  {
    companyName: 'Yıldız Kozmetik Ltd.',
    contactName: 'Ezgi Demir',
    phone: '+902128887766',
    email: 'ezgi@yildizkozmetik.com',
    address: 'İkitelli OSB. Bedrettin Cd. No:7 İstanbul',
    transportModes: ['Hava', 'Deniz'],
    serviceTypes: ['Parsiyel', 'LCL'],
    incoterms: ['EXW'],
    direction: 'İhracat',
    originCountries: ['Türkiye'],
    destinationCountries: ['Çin', 'ABD'],
    source: 'Dijital',
    potential: 'Orta',
    status: 'Aktif',
    notes: 'Online satış kanallarına direkt sevkiyat. Hızlı transit önemli.',
    assignedTo: 'ahmet',
    lastContactDaysAgo: 5,
    quotes: [
      {
        daysAgo: 15,
        validityDays: 21,
        transportMode: 'Hava',
        serviceType: 'Parsiyel',
        originCountry: 'Türkiye',
        pol: 'IST',
        destinationCountry: 'ABD',
        pod: 'JFK',
        incoterm: 'EXW',
        price: 5.45,
        currency: 'USD',
        priceNote: 'kg başına, min 100kg',
        status: 'Bekliyor',
      },
      {
        daysAgo: 35,
        validityDays: 30,
        transportMode: 'Deniz',
        serviceType: 'LCL',
        originCountry: 'Türkiye',
        pol: 'Ambarlı',
        destinationCountry: 'Çin',
        pod: 'Shanghai',
        incoterm: 'EXW',
        price: 95,
        currency: 'USD',
        priceNote: 'm³ başına',
        status: 'Kaybedildi',
        lossReason: 'Gecikmeli dönüş',
      },
    ],
    activities: [
      {
        daysAgo: 5,
        activityType: 'E-posta',
        notes: 'JFK ekspres servis fiyatı talep edildi.',
        outcome: 'Teklif İstendi',
        nextActionDays: 2,
      },
      {
        daysAgo: 36,
        activityType: 'Telefon',
        durationMinutes: 11,
        notes: 'Shanghai teklifimiz geç gitti, başka firmayı tercih etmişler.',
        outcome: 'Olumsuz',
      },
    ],
  },
];

async function getUserMap(): Promise<Record<string, SeedUser>> {
  const users = await prisma.user.findMany({
    where: { email: { in: [
      'admin@nakliyecrm.com',
      'ahmet@nakliyecrm.com',
      'ayse@nakliyecrm.com',
      'mehmet@nakliyecrm.com',
    ] } },
    select: { id: true, fullName: true, email: true },
  });
  const byKey: Record<string, SeedUser> = {};
  for (const u of users) {
    const key = u.email.split('@')[0];
    byKey[key] = { id: u.id, fullName: u.fullName };
  }
  if (!byKey.ahmet || !byKey.ayse || !byKey.mehmet || !byKey.admin) {
    throw new Error('Demo seed çalıştırmak için önce `bun run db:seed` ile temel kullanıcıları oluştur.');
  }
  return byKey;
}

function dateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

function dateNDaysAhead(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function nextQuoteNo(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await prisma.quotation.findFirst({
    where: { quoteNo: { startsWith: `TKF-${year}-` } },
    orderBy: { quoteNo: 'desc' },
    select: { quoteNo: true },
  });
  const lastNum = last ? parseInt(last.quoteNo.split('-')[2], 10) : 0;
  return `TKF-${year}-${String(lastNum + 1).padStart(4, '0')}`;
}

async function main() {
  console.log('--- Demo seed çalışıyor ---');
  const users = await getUserMap();

  let createdCustomers = 0;
  let createdQuotes = 0;
  let createdActivities = 0;
  let createdShipments = 0;

  for (const spec of customers) {
    const owner = users[spec.assignedTo];
    const lastContactDate = dateNDaysAgo(spec.lastContactDaysAgo);

    let customer = await prisma.customer.findFirst({
      where: { companyName: spec.companyName, isDeleted: false },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyName: spec.companyName,
          contactName: spec.contactName,
          phone: spec.phone,
          email: spec.email,
          address: spec.address,
          transportModes: spec.transportModes,
          serviceTypes: spec.serviceTypes,
          incoterms: spec.incoterms,
          direction: spec.direction,
          originCountries: spec.originCountries,
          destinationCountries: spec.destinationCountries,
          source: spec.source,
          potential: spec.potential,
          status: spec.status,
          notes: spec.notes,
          assignedUserId: owner.id,
          createdById: users.admin.id,
          lastContactDate,
        },
      });
      createdCustomers++;
      console.log(`  [+] Müşteri: ${customer.companyName} (sahibi: ${owner.fullName})`);
    } else {
      console.log(`  [=] Müşteri var: ${customer.companyName}`);
    }

    let lastQuoteDate: Date | null = null;

    for (const q of spec.quotes) {
      const quoteDate = dateNDaysAgo(q.daysAgo);
      if (!lastQuoteDate || quoteDate > lastQuoteDate) lastQuoteDate = quoteDate;

      const exists = await prisma.quotation.findFirst({
        where: {
          customerId: customer.id,
          price: q.price,
          quoteDate,
        },
      });
      if (exists) {
        console.log(`    [=] Teklif var: ${exists.quoteNo}`);
        continue;
      }

      const quoteNo = await nextQuoteNo();
      const validityDate = new Date(quoteDate);
      validityDate.setDate(validityDate.getDate() + q.validityDays);

      const quotation = await prisma.quotation.create({
        data: {
          quoteNo,
          customerId: customer.id,
          quoteDate,
          validityDate,
          transportMode: q.transportMode,
          serviceType: q.serviceType,
          originCountry: q.originCountry,
          pol: q.pol,
          destinationCountry: q.destinationCountry,
          pod: q.pod,
          incoterm: q.incoterm,
          price: q.price,
          currency: q.currency,
          priceNote: q.priceNote,
          status: q.status,
          lossReason: q.lossReason,
          assignedUserId: owner.id,
          createdById: owner.id,
        },
      });
      createdQuotes++;
      console.log(`    [+] Teklif: ${quoteNo} (${q.status}, ${q.price} ${q.currency})`);

      if (q.status === 'Kazanıldı' && q.shipmentStatus) {
        const shipmentNo = `SVK-${new Date().getFullYear()}-${String(quotation.id).padStart(4, '0')}`;
        const etd = new Date(quoteDate);
        etd.setDate(etd.getDate() + 7);
        const eta = new Date(etd);
        eta.setDate(eta.getDate() + 28);
        const atd = q.shipmentStatus !== 'booked' ? etd : null;
        const ata = q.shipmentStatus === 'arrived' || q.shipmentStatus === 'delivered' ? eta : null;

        await prisma.shipment.create({
          data: {
            shipmentNo,
            quotationId: quotation.id,
            customerId: customer.id,
            transportMode: q.transportMode,
            serviceType: q.serviceType,
            originCountry: q.originCountry,
            pol: q.pol,
            destinationCountry: q.destinationCountry,
            pod: q.pod,
            etd,
            eta,
            atd,
            ata,
            status: q.shipmentStatus,
            assignedUserId: owner.id,
            createdById: owner.id,
          },
        });
        createdShipments++;
        console.log(`      [+] Sevkiyat: ${shipmentNo} (${q.shipmentStatus})`);
      }
    }

    if (lastQuoteDate) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastQuoteDate },
      });
    }

    for (const a of spec.activities) {
      const activityDate = dateNDaysAgo(a.daysAgo);
      const byKey = a.byUser ?? spec.assignedTo;
      const author = users[byKey] ?? owner;

      const exists = await prisma.activity.findFirst({
        where: {
          customerId: customer.id,
          activityType: a.activityType,
          activityDate,
          createdById: author.id,
        },
      });
      if (exists) continue;

      await prisma.activity.create({
        data: {
          customerId: customer.id,
          activityType: a.activityType,
          activityDate,
          durationMinutes: a.durationMinutes,
          notes: a.notes,
          outcome: a.outcome,
          nextActionDate: a.nextActionDays ? dateNDaysAhead(a.nextActionDays) : null,
          createdById: author.id,
        },
      });
      createdActivities++;
    }
  }

  console.log('\n--- Demo seed tamamlandı ---');
  console.log(`  Yeni müşteri:   ${createdCustomers}`);
  console.log(`  Yeni teklif:    ${createdQuotes}`);
  console.log(`  Yeni aktivite:  ${createdActivities}`);
  console.log(`  Yeni sevkiyat:  ${createdShipments}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
