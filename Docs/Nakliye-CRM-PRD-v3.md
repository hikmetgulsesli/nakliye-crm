# 📦 Uluslararası Nakliye CRM — Ürün Gereksinim Dökümanı (PRD)

**Versiyon:** 3.0  
**Tarih:** 01 Mart 2026  
**Proje Sahibi:** Hakan Gülsesli  

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknik Yığın Önerisi](#teknik-yığın-önerisi)
3. [Kullanıcı Rolleri ve Yetki Matrisi](#kullanıcı-rolleri-ve-yetki-matrisi)
4. [Modüller ve Özellikler](#modüller-ve-özellikler)
   - [Modül 1: Müşteri Kartı ve Çakışma Önleme](#modül-1-müşteri-kartı-ve-çakışma-önleme)
   - [Modül 2: Teklif Yönetimi](#modül-2-teklif-yönetimi)
   - [Modül 3: Aktivite ve Görüşme Takibi](#modül-3-aktivite-ve-görüşme-takibi)
   - [Modül 4: Hatırlatma ve Uyarı Sistemi](#modül-4-hatırlatma-ve-uyarı-sistemi)
   - [Modül 5: Dashboard Sistemi](#modül-5-dashboard-sistemi)
   - [Modül 6: Raporlar ve Export](#modül-6-raporlar-ve-export)
   - [Modül 7: Dinamik Alan Yönetimi](#modül-7-dinamik-alan-yönetimi)
   - [Modül 8: Temsilci Atama ve Devir](#modül-8-temsilci-atama-ve-devir)
   - [Modül 9: Log ve Denetim Sistemi](#modül-9-log-ve-denetim-sistemi)
5. [Güvenlik Gereksinimleri](#güvenlik-gereksinimleri)
6. [MVP Geliştirme Roadmap](#mvp-geliştirme-roadmap)
7. [Faz 2: Yapay Zeka Özellikleri](#faz-2-yapay-zeka-özellikleri)
8. [Veritabanı Şeması Önerileri](#veritabanı-şeması-önerileri)

---

## Proje Özeti

Uluslararası nakliye operasyonlarına özel, **basit, sade ve hızlı** çalışan bir web tabanlı CRM uygulaması. 

### Temel Hedefler
- Satış ekibinin müşteri ve teklif takibini kolaylaştırmak
- Dashboard'lar ile durum takibi yapmak
- Yetkili kişilerin rapor çıktıları alabilmesini sağlamak
- Müşteri çakışmalarını önlemek
- Ekip performansını şeffaf şekilde ölçümlemek

### Kritik Kararlar
✅ Tüm kullanıcılar tüm müşterileri görebilir (çakışma önleme için kritik)  
✅ Herkes teklif oluşturabilir ve güncelleme yapabilir  
✅ Güncelleme yapan kişi işlem sahibi olarak logda görünür  
✅ Dinamik alan yönetimi (liste değerleri kod değişikliği gerektirmez)  
✅ Admin temsilci devir işlemi yapabilir  

---

## Teknik Yığın Önerisi

Yapay zeka destekli hızlı geliştirme için önerilen teknolojiler:

### Frontend
- **Framework:** Next.js 14+ (App Router) veya React 18+
- **UI Kütüphanesi:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand veya React Context
- **Form Yönetimi:** React Hook Form + Zod validation

### Backend
- **Seçenek 1 (Hızlı):** Supabase (BaaS — auth + database + realtime)
- **Seçenek 2 (Özelleştirilebilir):** Node.js + Express + PostgreSQL

### Veritabanı
- **PostgreSQL** (ilişkisel yapı, foreign key desteği)
- Full-text search için PostgreSQL pg_trgm extension

### Authentication
- Supabase Auth veya NextAuth.js
- Rol tabanlı erişim kontrolü (RBAC)

### Deployment
- **Frontend:** Vercel veya Netlify
- **Backend:** Supabase veya Railway / Render
- **Veritabanı:** Supabase PostgreSQL veya Neon

---

## Kullanıcı Rolleri ve Yetki Matrisi

Sistemde **2 ana rol** vardır:

### Roller

#### 1️⃣ Admin (Yönetici)
- Sen ve yetkili yöneticiler

#### 2️⃣ Kullanıcı (Satış Temsilcisi)
- Satış ekibi (5 kişi)

### Yetki Matrisi

| Özellik | Admin | Kullanıcı |
|---------|-------|-----------|
| Tüm müşterileri görme | ✅ | ✅ |
| Müşteri ekleme / güncelleme | ✅ | ✅ |
| Teklif oluşturma / güncelleme | ✅ | ✅ |
| Aktivite kaydetme | ✅ | ✅ |
| Kendi dashboard'unu görme | ✅ | ✅ |
| **Tüm ekip dashboard'unu görme** | ✅ | ❌ |
| **Rapor export (PDF/Excel)** | ✅ | ❌ |
| **Kayıt silme** | ✅ | ❌ |
| **Başkasının kaydını silme/düzenleme** | ✅ | ❌ |
| **Kullanıcı yönetimi** | ✅ | ❌ |
| **Sistem ayarları (dinamik listeler)** | ✅ | ❌ |
| **Temsilci devir işlemi** | ✅ | ❌ |
| **Log görüntüleme** | ✅ | ❌ |

---

## Modüller ve Özellikler

---

## Modül 1: Müşteri Kartı ve Çakışma Önleme

### Temel Bilgiler

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Müşteri / Firma Adı** | Text | Zorunlu — çakışma kontrolü yapılır |
| **Yetkili Adı** | Text | İletişim kurulan kişi |
| **Telefon** | Text | Zorunlu — çakışma kontrolü yapılır |
| **E-posta** | Email | Zorunlu — çakışma kontrolü yapılır |
| **Adres** | Text | Opsiyonel |

### Nakliye Tercihleri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Taşıma Modu** | Dropdown (çoklu) | Deniz / Hava / Kara / Kombine |
| **Servis Tipi** | Dropdown (çoklu) | FCL / LCL / Parsiyel / Komple / Bulk / RoRo |
| **Satış Şekli (Incoterm)** | Dropdown (çoklu) | FOB / EXW / FCA / DAP / CIF / CFR / DDP |
| **İşlem Yönü** | Checkbox | İthalat / İhracat (ikisi de seçilebilir) |

### Lokasyon Bilgileri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Çıkış Ülkeleri** | Multi-select | Müşterinin yük aldığı ülkeler |
| **Varış Ülkeleri** | Multi-select | Müşterinin yük gönderdiği ülkeler |

### CRM Bilgileri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Kaynak** | Dropdown | Referans / Soğuk arama / Fuar / Dijital |
| **Potansiyel** | Dropdown | Düşük / Orta / Yüksek |
| **Müşteri Durumu** | Dropdown | Aktif / Pasif / Soğuk |
| **Atanan Temsilci** | Dropdown | Sorumlu satış temsilcisi |
| **Son Görüşme Tarihi** | Date | Otomatik — aktivite kaydından doldurulur |
| **Son Teklif Tarihi** | Date | Otomatik — teklif kaydından doldurulur |
| **Açıklama / Not** | Textarea | Serbest not alanı |

---

### 🚨 Müşteri Çakışma Önleme Sistemi

**En kritik özellik** — Aynı müşterinin birden fazla kez kaydedilmesini önler.

#### Kontrol Edilen Alanlar
1. **Firma adı** — Fuzzy match (%80+ benzerlik uyarı verir)
2. **Telefon numarası** — Birebir eşleşme
3. **E-posta adresi** — Birebir eşleşme (case-insensitive)

#### Çalışma Akışı

**Adım 1: Gerçek Zamanlı Kontrol**
- Kullanıcı firma adı yazmaya başladığında sistem anlık benzer kayıtları listeler
- Google tarzı arama önerisi gösterilir

**Adım 2: Form Validation**
- Telefon veya e-posta girildiğinde eşleşme kontrolü yapılır
- Eşleşme varsa **sarı uyarı banner** gösterilir:
  > ⚠️ Bu telefon numarası başka bir kayıtta kullanılıyor

**Adım 3: Submit Kontrolü**
- Kaydet butonuna basıldığında nihai kontrol yapılır
- Eşleşme tespit edilirse **modal açılır:**

```
🔴 Bu Müşteri Zaten Kayıtlı Olabilir

Sistemde benzer kayıtlar bulundu:

┌─────────────────────────────────────────────────┐
│ ABC Lojistik Ltd.                               │
│ Atanan: Ahmet Yılmaz                            │
│ Son Görüşme: 15.02.2026                         │
│ [Kaydı Aç]                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ABC Logistics                                   │
│ Atanan: Mehmet Kaya                             │
│ Son Görüşme: 20.01.2026                         │
│ [Kaydı Aç]                                      │
└─────────────────────────────────────────────────┘

[❌ İptal]  [⚠️ Yine de Kaydet (Admin Onayı)]
```

#### Yetki Kuralları
- **Kullanıcı:** Çakışma varsa yeni kayıt oluşturamaz, mevcut kaydı açabilir
- **Admin:** "Yine de Kaydet" seçeneği ile zorlayarak kayıt oluşturabilir
- Her zorlamalı kayıt logda işaretlenir

---

## Modül 2: Teklif Yönetimi

### Teklif Bilgileri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Teklif No** | Auto-generated | TKF-2026-0001 formatında |
| **Bağlı Müşteri** | Dropdown (searchable) | Müşteri kartından seçim |
| **Teklif Tarihi** | Date | Default: bugün |
| **Geçerlilik Tarihi** | Date | Teklifin son geçerli tarihi |

### Yük Hareketi Bilgileri (Nakliye Terminolojisi)

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Taşıma Modu** | Dropdown | Deniz / Hava / Kara / Kombine |
| **Servis Tipi** | Dropdown | FCL / LCL / Parsiyel / Komple / Bulk / RoRo |
| **Çıkış Ülkesi** | Dropdown | Yükün alındığı ülke |
| **Yükleme Noktası (POL)** | Dropdown/Text | Port of Loading — liman veya şehir |
| **Varış Ülkesi** | Dropdown | Yükün teslim edileceği ülke |
| **Varış Noktası (POD)** | Dropdown/Text | Port of Discharge — liman veya şehir |
| **Satış Şekli (Incoterm)** | Dropdown | FOB / EXW / FCA / DAP / CIF / CFR / DDP |

### Fiyat Bilgileri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Fiyat** | Number | Teklif tutarı |
| **Para Birimi** | Dropdown | USD / EUR / TRY |
| **Fiyat Notu** | Textarea | Opsiyonel açıklama |

### Teklif Durumu

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Sonuç** | Dropdown | Bekliyor / Kazanıldı / Kaybedildi |
| **Kaybedilme Nedeni** | Dropdown | Fiyat / Rakip / Gecikmeli dönüş / Diğer (yalnızca "Kaybedildi" seçiliyse gösterilir) |
| **Atanan Temsilci** | Dropdown | Teklifi hazırlayan kişi |
| **Revize Sayısı** | Auto-calculated | Kaç kez güncellendiği |

### Revize Geçmişi

Her teklif güncellenmesinde otomatik log:

| Revize No | Tarih | Güncelleyen | Değişiklik |
|-----------|-------|-------------|------------|
| Rev-1 | 15.02.2026 | Ahmet Y. | Fiyat: $2000 → $1850 |
| Rev-2 | 20.02.2026 | Ahmet Y. | POD: İstanbul → İzmir |

---

## Modül 3: Aktivite ve Görüşme Takibi

Her müşteri ile yapılan iletişim kaydedilir.

### Aktivite Bilgileri

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Bağlı Müşteri** | Dropdown | Hangi müşteri ile görüşüldü |
| **Aktivite Tipi** | Dropdown | Telefon / E-posta / Yüz Yüze / Video Görüşme |
| **Tarih ve Saat** | DateTime | Görüşme zamanı |
| **Süre (dakika)** | Number | Opsiyonel |
| **Görüşme Notu** | Textarea | Ne konuşuldu |
| **Sonuç** | Dropdown | Olumlu / Nötr / Olumsuz / Teklif İstendi |
| **Sonraki Aksiyon Tarihi** | Date | Follow-up planlama için |
| **Kaydeden Kişi** | Auto-fill | Giriş yapan kullanıcı |

### Otomatik Güncelleme
- Aktivite kaydedildiğinde müşteri kartındaki **"Son Görüşme Tarihi"** otomatik güncellenir
- Teklif oluşturulduğunda **"Son Teklif Tarihi"** otomatik güncellenir

---

## Modül 4: Hatırlatma ve Uyarı Sistemi

Sistem otomatik olarak takip listesi oluşturur.

### Otomatik Listeler

| Liste | Kriter | Görünüm |
|-------|--------|---------|
| 🔴 **Aranmayan Müşteriler** | 14 gündür aktivite yok | Dashboard widget + bildirim |
| 🟡 **Bekleyen Teklifler** | 7+ gün dönüş yok | Dashboard widget |
| 🟠 **Süresi Dolan Teklifler** | Geçerlilik tarihi geçmiş, durum "Bekliyor" | Dashboard widget |
| 🟢 **Yüksek Potansiyel** | Potansiyel=Yüksek + 30 gün teklif yok | Dashboard widget |

### Bildirim Sistemi

#### Dashboard Widget
- Her liste için sayı badge'i
- Tıklanınca filtrelenmiş müşteri/teklif listesi açılır

#### E-posta Bildirimi (Opsiyonel)
- Admin ayarlardan açabilir
- Günlük özet e-postası (sabah 09:00)
- Kritik uyarılar anlık gönderilir

---

## Modül 5: Dashboard Sistemi

Her rol için özel dashboard görünümü.

---

### 👤 Kullanıcı Dashboard'u

Satış temsilcisi girdiğinde gördüğü ekran.

#### Kişisel Metrikler

| Metrik | Açıklama |
|--------|----------|
| Bu Hafta Verilen Teklif | Sayı |
| Bu Ay Verilen Teklif | Sayı |
| Bu Ay Kazanılan Teklif | Sayı + kazanma oranı % |
| Bu Ay Görüşülen Müşteri | Sayı |

#### Widget'lar

**1. Yaklaşan Follow-up'lar**
- Bugün veya önümüzdeki 3 gün için planlanmış aktiviteler
- Tıklanınca müşteri kartı açılır

**2. Aranması Gereken Müşteriler (🔴)**
- Kullanıcının atandığı müşterilerden 14 gün arılmayanlar

**3. Bekleyen Teklifler (🟡)**
- Kullanıcının oluşturduğu, 7+ gün dönüş almayan teklifler

**4. Son Aktiviteler**
- Son 10 aktivite kaydı (tüm kullanıcıların — şeffaflık için)

---

### 👨‍💼 Admin Dashboard'u

Yönetici girdiğinde gördüğü ekran.

#### Genel Metrikler

| Metrik | Zaman Aralığı |
|--------|---------------|
| Verilen Teklif Sayısı | Bu hafta / Bu ay / Geçen ay |
| Kazanılan Teklif Sayısı | Bu hafta / Bu ay / Geçen ay |
| Kazanma Oranı (%) | Bu ay (Kazanılan / Verilen) |
| Aktif Müşteri Sayısı | Toplam |
| Yüksek Potansiyel Müşteri | Toplam |

#### Personel Performans Tablosu

| Temsilci | Teklif Sayısı | Kazanılan | Kazanma % | Görüşülen Müşteri |
|----------|---------------|-----------|-----------|-------------------|
| Ahmet Y. | 15 | 8 | 53% | 32 |
| Mehmet K. | 12 | 5 | 42% | 28 |
| Ayşe D. | 18 | 10 | 56% | 40 |
| Fatma S. | 10 | 4 | 40% | 22 |
| Ali T. | 14 | 7 | 50% | 30 |

#### Ülke Bazlı Yoğunluk

**Çıkış Ülkesi (Top 5)**
| Ülke | Teklif Sayısı |
|------|---------------|
| Çin | 35 |
| Almanya | 22 |
| İtalya | 18 |
| ABD | 15 |
| İngiltere | 12 |

**Varış Ülkesi (Top 5)**
| Ülke | Teklif Sayısı |
|------|---------------|
| Türkiye | 68 |
| İngiltere | 12 |
| Fransa | 8 |
| İspanya | 6 |
| Hollanda | 4 |

#### Mod Bazlı Dağılım

| Taşıma Modu | Teklif Sayısı | Kazanma % |
|-------------|---------------|-----------|
| Deniz | 45 | 52% |
| Hava | 28 | 48% |
| Kara | 15 | 60% |
| Kombine | 8 | 50% |

#### Kaybedilme Nedeni Analizi

| Neden | Sayı | Oran |
|-------|------|------|
| Fiyat | 12 | 48% |
| Rakip | 8 | 32% |
| Gecikmeli Dönüş | 3 | 12% |
| Diğer | 2 | 8% |

---

### 🔍 Filtreleme Sistemi

Tüm liste ve dashboard ekranlarında uygulanabilir filtreler:

| Filtre | Değerler |
|--------|----------|
| Tarih Aralığı | Başlangıç - Bitiş |
| Çıkış Ülkesi | Çoklu seçim |
| Varış Ülkesi | Çoklu seçim |
| Taşıma Modu | Deniz / Hava / Kara / Kombine |
| Servis Tipi | FCL / LCL / Parsiyel / Komple / Bulk |
| Atanan Temsilci | Kullanıcı listesi |
| Potansiyel | Düşük / Orta / Yüksek |
| Müşteri Durumu | Aktif / Pasif / Soğuk |
| Para Birimi | USD / EUR / TRY |
| Satış Şekli | FOB / EXW / FCA / DAP / CIF vb. |

---

## Modül 6: Raporlar ve Export

**Yalnızca Admin'e özel.**

### Rapor Tipleri

#### 1️⃣ Dönemsel Teklif Raporu
- Tarih aralığı seçimi
- Tüm teklifler veya filtrelenmiş
- Export: PDF + Excel

**İçerik:**
- Teklif listesi (detaylı)
- Kazanma oranları
- Toplam teklif değeri (para birimi bazlı)

#### 2️⃣ Personel Performans Raporu
- Seçilen dönem için her temsilcinin performansı
- Export: PDF + Excel

**İçerik:**
- Teklif sayısı, kazanma oranı
- Görüşülen müşteri sayısı
- Ortalama teklif değeri
- Kaybedilme nedenleri dağılımı

#### 3️⃣ Kazanılan / Kaybedilen Teklif Analizi
- Dönem seçimi
- Kazanılan ve kaybedilen tekliflerin detaylı analizi
- Export: PDF + Excel

**İçerik:**
- Kazanılan teklifler listesi
- Kaybedilen teklifler + neden
- Ülke, mod, temsilci bazlı breakdown

#### 4️⃣ Ülke / Mod Bazlı Hacim Raporu
- Hangi ülkelerden / hangi modlarda yoğunluk var
- Export: PDF + Excel

**İçerik:**
- Çıkış - varış ülke kombinasyonları
- Mod bazlı teklif sayısı ve toplam değer
- Trend grafiği (aylık)

#### 5️⃣ Kaybedilme Nedeni Analizi
- Neden rakiplere kaybediyoruz?
- Export: PDF + Excel

**İçerik:**
- Kaybedilme nedeni dağılımı (grafik)
- Neden bazlı detay listesi
- Öneri notları (admin ekleyebilir)

---

## Modül 7: Dinamik Alan Yönetimi

**Admin panelinde** → Sistem Ayarları → **Liste Yönetimi**

Kod değişikliği gerektirmeden liste değerlerini yönet.

### Yönetilebilen Listeler

| Liste Adı | Örnek Değerler |
|-----------|----------------|
| Taşıma Modu | Deniz, Hava, Kara, Kombine, Multimodal |
| Servis Tipi | FCL, LCL, Parsiyel, Komple, Bulk, RoRo, Break Bulk |
| Satış Şekli (Incoterm) | FOB, EXW, FCA, DAP, CIF, CFR, DDP, DDU |
| Müşteri Kaynağı | Referans, Soğuk arama, Fuar, Dijital, LinkedIn, Mevcut müşteri tavsiyesi |
| Müşteri Durumu | Aktif, Pasif, Soğuk, Potansiyel |
| Potansiyel Seviyesi | Düşük, Orta, Yüksek, A+ (Stratejik) |
| Teklif Sonuç Durumu | Bekliyor, Kazanıldı, Kaybedildi, İptal |
| Kaybedilme Nedeni | Fiyat, Rakip, Gecikmeli dönüş, Bütçe yok, Diğer |
| Para Birimi | USD, EUR, TRY, GBP, CNY |
| Liman / Nokta | Shanghai, Shenzhen, Hamburg, Rotterdam, İstanbul-Ambarlı, İzmir vb. |
| Ülke | Türkiye, Çin, Almanya, İtalya, ABD, İngiltere vb. |

### Yönetim İşlemleri

Her liste kalemi için:

#### ➕ Yeni Değer Ekle
- Değer adı gir
- Sıra numarası (isteğe bağlı)
- Kaydet

#### ✏️ Mevcut Değeri Düzenle
- Değer adını değiştir
- **Uyarı gösterilir:**
  > ⚠️ Bu değişiklik mevcut 45 kayda yansıyacak. Devam etmek istiyor musunuz?
- Onayla → tüm kayıtlar güncellenir

#### 🔴 Pasife Al
- Değer **silinmez**, pasife alınır
- Eski kayıtlarda görünmeye devam eder
- Yeni kayıtlarda dropdown'da çıkmaz
- **Badge:** 🔴 Pasif

#### 🔃 Sıralama
- Drag & drop ile dropdown sırası değiştir
- Sık kullanılanlar üste getirilebilir

### Teknik Uygulama
- Tüm dinamik listeler tek bir `lookup_values` tablosunda tutulur
- Her değer için: `category` (liste adı), `value` (değer), `is_active`, `sort_order`
- Dropdown'larda `is_active = true` olanlar gösterilir
- Raporlarda pasif değerler de okunabilir

---

## Modül 8: Temsilci Atama ve Devir

### Tekil Atama Değişikliği

- Admin herhangi bir müşteri kartını açar
- **"Atanan Temsilci"** dropdown'ını değiştirir
- Kaydet

**Log kaydı:**
```
Temsilci güncellendi: Ahmet Yılmaz → Mehmet Kaya
Güncelleyen: Admin | 01.03.2026 02:30
```

---

### Toplu Devir İşlemi

**Senaryo:** Bir temsilci işten ayrıldı, tüm müşterileri başka birine devredilecek.

#### İşlem Adımları

**1. Admin Paneli → Kullanıcı Yönetimi → Temsilci Devri**

**2. Devir Formu**
```
┌────────────────────────────────────────┐
│ Devredilecek Temsilci: [Ahmet Y. ▾]   │
│ Devralacak Temsilci:   [Mehmet K. ▾]  │
│                                        │
│ Hangi Kayıtlar Devredilsin?            │
│ ○ Tüm kayıtlar                         │
│ ○ Sadece aktif müşteriler              │
│ ○ Açık teklifler                       │
│                                        │
│ [Önizleme]                             │
└────────────────────────────────────────┘
```

**3. Önizleme Ekranı**
```
Ahmet Yılmaz → Mehmet Kaya devri

Etkilenecek Kayıtlar:
- 32 müşteri
- 18 açık teklif
- 45 aktivite kaydı (yalnızca atanan değişir)

[❌ İptal]  [✅ Devri Onayla]
```

**4. Onay Sonrası**
- Toplu güncelleme yapılır (transaction içinde)
- Tek bir toplu log kaydı düşer:
  ```
  Toplu temsilci devri yapıldı
  Ahmet Yılmaz → Mehmet Kaya
  32 müşteri, 18 teklif aktarıldı
  İşlemi yapan: Admin | 01.03.2026 02:35
  ```

**5. Eski Temsilci Pasife Alınır**
- Kullanıcı hesabı **silinmez**, pasife alınır
- Geçmiş kayıtlarda adı görünür
- Giriş yapamaz
- Loglar korunur

---

## Modül 9: Log ve Denetim Sistemi

Her değişiklik kaydedilir.

### Log Kapsamı

| İşlem | Kaydedilen Bilgi |
|-------|------------------|
| Müşteri oluşturma | Kim, ne zaman, hangi alanlar |
| Müşteri güncelleme | Kim, ne zaman, hangi alan değişti (eski → yeni) |
| Teklif oluşturma | Kim, ne zaman |
| Teklif güncelleme | Kim, ne zaman, hangi alan değişti |
| Aktivite kaydı | Kim, ne zaman |
| Temsilci değişikliği | Kim, ne zaman, eski → yeni |
| Kayıt silme | Kim, ne zaman, hangi kayıt |
| Zorlamalı çakışma kaydı | Kim, ne zaman, hangi alanlar çakıştı |

### Log Görünümü

#### Müşteri Detay Sayfasında — "Geçmiş" Sekmesi

```
┌──────────────────────────────────────────────────────────┐
│ 01.03.2026 02:10  |  Ahmet Y.  |  Kayıt oluşturuldu      │
├──────────────────────────────────────────────────────────┤
│ 01.03.2026 14:22  |  Mehmet K. |  Alan güncellendi       │
│                   Potansiyel: Orta → Yüksek              │
├──────────────────────────────────────────────────────────┤
│ 02.03.2026 09:05  |  Admin     |  Temsilci değiştirildi  │
│                   Ahmet Y. → Mehmet K.                    │
├──────────────────────────────────────────────────────────┤
│ 02.03.2026 11:30  |  Mehmet K. |  Teklif oluşturuldu     │
│                   TKF-2026-0042                           │
└──────────────────────────────────────────────────────────┘
```

#### Admin Panel — Sistem Log Görüntüleme

- Tüm logları görüntüle
- Filtrele: Kullanıcı / İşlem tipi / Tarih aralığı
- Export: CSV

### Teknik Detay

**Field-level diff** kaydedilir:
```json
{
  "user_id": 5,
  "record_type": "customer",
  "record_id": 123,
  "action": "update",
  "changes": {
    "potential": {
      "old": "Orta",
      "new": "Yüksek"
    }
  },
  "timestamp": "2026-03-01T14:22:00Z"
}
```

---

## Güvenlik Gereksinimleri

### Authentication

- ✅ E-posta + şifre ile giriş
- ✅ Şifre politikası: Min 8 karakter, en az 1 özel karakter
- ✅ Oturum süresi: 8 saat otomatik logout
- ✅ "Beni hatırla" seçeneği (30 gün)

### Admin Güvenlik

- ✅ 2FA zorunlu (Admin hesapları için)
- ✅ IP kısıtlaması (opsiyonel)

### Veri Güvenliği

- ✅ Şifreler hash'lenmiş (bcrypt)
- ✅ HTTPS zorunlu
- ✅ SQL injection koruması (prepared statements)
- ✅ XSS koruması

### Yetki Kontrolleri

- ✅ Her API endpoint'te rol kontrolü
- ✅ Kullanıcı yalnızca kendi aktivitelerini silebilir
- ✅ Admin her kaydı silebilir / düzenleyebilir
- ✅ Silme işlemleri geri alınabilir (soft delete)

### Log Güvenliği

- ✅ Loglar silinemez, düzenlenemez
- ✅ Yalnızca Admin logları görüntüleyebilir

---

## MVP Geliştirme Roadmap

### Sprint 1: Temel Altyapı (2 hafta)

**Hedef:** Kullanıcı girişi yapabilir, müşteri ekleyebilir.

#### Backend
- [ ] Veritabanı şeması oluştur (PostgreSQL)
- [ ] Auth sistem kur (Supabase Auth veya NextAuth.js)
- [ ] Rol tabanlı middleware
- [ ] User CRUD API
- [ ] Customer CRUD API

#### Frontend
- [ ] Login / Register sayfası
- [ ] Layout ve navigasyon
- [ ] Müşteri listesi sayfası
- [ ] Müşteri ekleme formu
- [ ] Müşteri detay sayfası

#### Özellikler
- ✅ Kullanıcı girişi
- ✅ Müşteri ekleme, listeleme, detay görüntüleme
- ✅ Temel yetki kontrolü (Admin / Kullanıcı)

---

### Sprint 2: Çakışma Önleme + Dinamik Listeler (2 hafta)

**Hedef:** Müşteri çakışması engellenir, liste değerleri dinamik yönetilir.

#### Backend
- [ ] Fuzzy search endpoint (müşteri adı benzerliği)
- [ ] Telefon / e-posta eşleşme kontrolü
- [ ] `lookup_values` tablosu ve API
- [ ] Liste yönetimi CRUD (Admin only)

#### Frontend
- [ ] Müşteri formunda gerçek zamanlı çakışma kontrolü
- [ ] Çakışma uyarı modal'ı
- [ ] Admin paneli: Liste yönetimi ekranı
- [ ] Dinamik dropdown'lar (tüm formlarda)

#### Özellikler
- ✅ Müşteri çakışma önleme sistemi
- ✅ Dinamik liste yönetimi (Admin)
- ✅ Dropdown'lar artık dinamik

---

### Sprint 3: Teklif Modülü (2 hafta)

**Hedef:** Teklif oluşturulabilir, revize edilebilir.

#### Backend
- [ ] Quotation CRUD API
- [ ] Otomatik teklif no üretimi
- [ ] Revize geçmişi sistemi
- [ ] Müşteri kartına son teklif tarihi otomatik güncelleme

#### Frontend
- [ ] Teklif listesi sayfası
- [ ] Teklif ekleme formu
- [ ] Teklif detay sayfası
- [ ] Revize geçmişi görünümü
- [ ] Müşteri detayında teklifler sekmesi

#### Özellikler
- ✅ Teklif oluşturma
- ✅ Teklif revize etme
- ✅ Revize geçmişi
- ✅ POL/POD sistemi

---

### Sprint 4: Log Sistemi + Temsilci Devir (1 hafta)

**Hedef:** Her değişiklik loglanır, temsilci devri yapılabilir.

#### Backend
- [ ] `audit_log` tablosu
- [ ] Field-level diff logging
- [ ] Log API (Admin only)
- [ ] Toplu temsilci devir API

#### Frontend
- [ ] Müşteri detayında "Geçmiş" sekmesi
- [ ] Admin panel: Log görüntüleme
- [ ] Admin panel: Temsilci devir ekranı

#### Özellikler
- ✅ Tüm değişiklikler loglanır
- ✅ Temsilci devir işlemi

---

### Sprint 5: Aktivite Takibi + Hatırlatmalar (1 hafta)

**Hedef:** Görüşmeler kaydedilir, otomatik hatırlatmalar üretilir.

#### Backend
- [ ] Activity CRUD API
- [ ] Müşteri kartına son görüşme tarihi otomatik güncelleme
- [ ] Hatırlatma query'leri (14 gün uyarısı vb.)

#### Frontend
- [ ] Aktivite ekleme modal'ı (müşteri detayında)
- [ ] Aktivite listesi (müşteri detayında)
- [ ] Dashboard widget'ları (🔴 🟡 🟠 🟢)

#### Özellikler
- ✅ Aktivite kaydetme
- ✅ Hatırlatma listeleri

---

### Sprint 6: Dashboard (2 hafta)

**Hedef:** Kullanıcı ve Admin dashboard'ları çalışır.

#### Backend
- [ ] Dashboard metrik API'leri
- [ ] Personel performans query
- [ ] Ülke / mod bazlı yoğunluk query
- [ ] Kaybedilme nedeni analizi query

#### Frontend
- [ ] Kullanıcı dashboard (kişisel metrikler + widget'lar)
- [ ] Admin dashboard (genel metrikler + tablolar + grafikler)
- [ ] Filtreleme sistemi (tüm ekranlarda)

#### Özellikler
- ✅ Kullanıcı dashboard'u
- ✅ Admin dashboard'u
- ✅ Filtreleme

---

### Sprint 7: Raporlar + Export (1 hafta)

**Hedef:** Raporlar PDF ve Excel olarak export edilebilir.

#### Backend
- [ ] Rapor query'leri (5 adet)
- [ ] PDF export kütüphanesi entegrasyonu
- [ ] Excel export kütüphanesi entegrasyonu

#### Frontend
- [ ] Rapor seçim ekranı
- [ ] Rapor önizleme
- [ ] Export butonları

#### Özellikler
- ✅ 5 tip rapor
- ✅ PDF + Excel export

---

### Sprint 8: E-posta Bildirimleri + Son Rötuşlar (1 hafta)

**Hedef:** Sistem tamamen çalışır, canlıya alınabilir.

#### Backend
- [ ] E-posta gönderim servisi (örn: SendGrid, Resend)
- [ ] Günlük özet e-posta job'ı
- [ ] Kritik uyarı e-postaları

#### Frontend
- [ ] E-posta ayarları (Admin panel)
- [ ] Kullanıcı bildirimleri (bell icon)

#### Test & Deploy
- [ ] Tüm modüller entegrasyon testi
- [ ] Performans testi (örnek veri ile)
- [ ] Production deploy
- [ ] SSL sertifikası
- [ ] Backup stratejisi

#### Özellikler
- ✅ E-posta bildirimleri
- ✅ Sistem canlıda

---

**Toplam Süre: 12 hafta (3 ay)**

---

## Faz 2: Yapay Zeka Özellikleri

MVP tamamlandıktan sonra eklenecek özellikler.

### 1️⃣ Kazanma İhtimali Tahmini 🤖

**Nasıl Çalışır:**
- Geçmiş teklif verilerine göre makine öğrenmesi modeli eğitilir
- Parametreler: Müşteri potansiyeli, teklif değeri, ülke, mod, temsilci geçmişi, revize sayısı
- Her teklif için **kazanma ihtimali %** gösterilir

**Kullanım:**
- Teklif detayında:
  > 🤖 Kazanma İhtimali: %68 (Yüksek)
- Öncelik sıralaması: Yüksek ihtimalli teklifler üste çıkar

---

### 2️⃣ Otomatik Teklif E-postası Taslağı ✉️

**Nasıl Çalışır:**
- Teklif bilgileri AI'ye gönderilir
- GPT-4 ile profesyonel e-posta taslağı oluşturulur
- Türkçe / İngilizce seçeneği

**Kullanım:**
- Teklif detayında "E-posta Oluştur" butonu
- AI taslak oluşturur
- Kullanıcı düzenleyip gönderir

**Örnek Çıktı:**
```
Sayın [Yetkili Adı],

[Firma Adı] için hazırladığımız [POL - POD] hattı 
[Servis Tipi] taşıma teklifimiz ektedir.

Fiyat: $[Fiyat] ([Incoterm])
Geçerlilik: [Tarih]

...
```

---

### 3️⃣ Müşteri Kaybetme Riski Uyarısı 📉

**Nasıl Çalışır:**
- Müşteri aktivite geçmişi analiz edilir
- Anormal düşüş tespit edilir:
  - Uzun süre arama yok
  - Teklif sayısı azaldı
  - Son teklifler kaybedildi
- Otomatik uyarı üretilir

**Kullanım:**
- Dashboard'da:
  > ⚠️ Risk Altındaki Müşteriler (3)
  > ABC Lojistik — 45 gün aranmadı, son 2 teklif kaybedildi

---

### 4️⃣ Personel Koçluk Önerileri 🎯

**Nasıl Çalışır:**
- Temsilci performansı analiz edilir
- Düşük performans nedenleri tespit edilir
- AI somut öneriler üretir

**Kullanım:**
- Admin dashboard'da temsilci bazlı:
  > 🎯 Ahmet Yılmaz için öneriler:
  > - Fiyat nedeniyle kaybetme oranı yüksek (60%) → Fiyat stratejisini gözden geçir
  > - Ortalama takip süresi 18 gün → Takip süresini kısaltmak için hatırlatmaları aktif kullan

---

## Veritabanı Şeması Önerileri

### Temel Tablolar

#### users
- id (PK)
- email
- password_hash
- full_name
- role (admin / user)
- is_active
- created_at, updated_at

#### customers
- id (PK)
- company_name
- contact_name
- phone
- email
- address
- transport_modes (JSON array veya çoka çok ilişki)
- service_types (JSON array)
- incoterms (JSON array)
- direction (import / export / both)
- origin_countries (JSON array)
- destination_countries (JSON array)
- source (lookup → kaynak)
- potential (lookup → potansiyel)
- status (lookup → müşteri durumu)
- assigned_user_id (FK → users)
- last_contact_date
- last_quote_date
- notes
- created_by (FK → users)
- created_at, updated_at

#### quotations
- id (PK)
- quote_no (unique)
- customer_id (FK → customers)
- quote_date
- validity_date
- transport_mode (lookup)
- service_type (lookup)
- origin_country
- pol (port of loading)
- destination_country
- pod (port of discharge)
- incoterm (lookup)
- price
- currency (lookup)
- price_note
- status (lookup: bekliyor / kazanıldı / kaybedildi)
- loss_reason (lookup, nullable)
- assigned_user_id (FK → users)
- revision_count
- created_by (FK → users)
- created_at, updated_at

#### quotation_revisions
- id (PK)
- quotation_id (FK → quotations)
- revision_no
- changed_fields (JSON: {field: {old, new}})
- revised_by (FK → users)
- revised_at

#### activities
- id (PK)
- customer_id (FK → customers)
- activity_type (lookup: telefon / e-posta / yüz yüze vb.)
- activity_date
- duration_minutes
- notes
- outcome (lookup: olumlu / nötr / olumsuz / teklif istendi)
- next_action_date
- created_by (FK → users)
- created_at

#### lookup_values
- id (PK)
- category (transport_mode, service_type, incoterm, source, potential, status, currency vb.)
- value
- is_active
- sort_order
- created_at, updated_at

#### audit_log
- id (PK)
- user_id (FK → users)
- record_type (customer / quotation / activity vb.)
- record_id
- action (create / update / delete / transfer)
- changes (JSON: field-level diff)
- timestamp

---

## Son Kontrol Listesi

Geliştirme tamamlanmadan önce mutlaka kontrol et:

### Fonksiyonellik
- [ ] Tüm kullanıcılar tüm müşterileri görebiliyor mu?
- [ ] Müşteri çakışma önleme çalışıyor mu?
- [ ] Dinamik listeler eklenip düzenlenebiliyor mu?
- [ ] Temsilci devir işlemi doğru çalışıyor mu?
- [ ] Log sistemi her değişikliği kaydediyor mu?
- [ ] Dashboard metrikleri doğru hesaplanıyor mu?
- [ ] Raporlar doğru export ediliyor mu?

### Performans
- [ ] 1000+ müşteri ile liste yavaşlıyor mu?
- [ ] Fuzzy search 1 saniye altında çalışıyor mu?
- [ ] Dashboard 2 saniye altında yükleniyor mu?

### Güvenlik
- [ ] SQL injection koruması var mı?
- [ ] XSS koruması var mı?
- [ ] Admin işlemleri yalnızca admin yapabiliyor mu?
- [ ] Loglar düzenlenemez / silinemez mi?

### UX
- [ ] Form validation mesajları Türkçe mi?
- [ ] Hata mesajları anlaşılır mı?
- [ ] Loading state'leri var mı?
- [ ] Mobil responsive mı?

---

## İletişim & Destek

**Proje Sahibi:** Hakan Gülsesli  
**E-posta:** [E-posta adresi]  
**Tarih:** 01 Mart 2026  

---

**Bu döküman, yapay zeka destekli geliştirme araçlarına (Cursor, Lovable, v0.dev vb.) direkt beslenebilecek şekilde hazırlanmıştır. Her modül adım adım uygulanabilir detaydadır.**