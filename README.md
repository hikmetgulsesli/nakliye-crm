# Nakliye CRM

Uluslararası nakliye operasyonlarına özel, basit ve hızlı çalışan web tabanlı CRM uygulaması. Satış ekibinin müşteri / teklif / aktivite takibini kolaylaştırmak, müşteri çakışmalarını önlemek ve ekip performansını şeffaf şekilde ölçümlemek için tasarlandı.

**Detaylı gereksinim dokümanı:** [`Docs/Nakliye-CRM-PRD-v3.md`](Docs/Nakliye-CRM-PRD-v3.md)

---

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Mimari](#mimari)
- [Kurulum](#kurulum)
- [Çalıştırma](#çalıştırma)
- [Varsayılan Hesaplar](#varsayılan-hesaplar)
- [Kullanışlı Komutlar](#kullanışlı-komutlar)
- [Proje Yapısı](#proje-yapısı)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Geliştirme Notları](#geliştirme-notları)

---

## Özellikler

PRD v3 üzerinden implemente edilmiş 9 çekirdek modül:

| # | Modül | Özet |
|---|-------|------|
| 1 | **Müşteri Kartı ve Çakışma Önleme** | Fuzzy match (%80+) firma adı, birebir telefon/e-posta kontrolü; gerçek-zamanlı uyarı + submit modal'ı |
| 2 | **Teklif Yönetimi** | Otomatik teklif numarası (`TKF-2026-0001`), POL/POD, Incoterm, para birimi, revize geçmişi |
| 3 | **Aktivite ve Görüşme Takibi** | Telefon / E-posta / Yüz Yüze / Video kayıtları; müşteri son görüşme tarihi otomatik güncellenir |
| 4 | **Hatırlatma ve Uyarı Sistemi** | 14 gün aranmayan, 7+ gün bekleyen teklif, süresi dolan teklif, yüksek potansiyel — dashboard widget + scheduler |
| 5 | **Dashboard Sistemi** | Kullanıcı KPI'ları, admin ekip performans tablosu, ülke/mod bazlı yoğunluk, kaybedilme nedeni analizi |
| 6 | **Raporlar ve Export** | 5 rapor tipi (dönemsel teklif, personel performans, kazanma/kaybetme, ülke-mod hacim, kaybedilme nedeni) — PDF + Excel |
| 7 | **Dinamik Alan Yönetimi** | `lookup_values` tablosu üzerinden kod değişikliği gerektirmeden liste yönetimi, drag-drop sıralama, pasife alma |
| 8 | **Temsilci Atama ve Devir** | Tekil atama + transaction içinde toplu devir + audit trail |
| 9 | **Log ve Denetim Sistemi** | Her işlem field-level diff ile kaydedilir, admin panelde filtre + CSV export |

**Destek:** Light / Dark tema toggle, Zod validation (backend + frontend), JWT auth + refresh token, 2FA (admin hesapları için), soft delete + restore, bildirim scheduler'ı (60 dk'da bir).

---

## Teknoloji Yığını

### Frontend (`apps/web`)

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 3 (darkMode: 'class')
- React Router v6 (lazy-loaded routes)
- React Hook Form + Zod
- Zustand (auth, theme, notifications, lookups, UI)
- Axios (token refresh interceptor)
- Material Symbols (ikon seti)

### Backend (`apps/api`)

- Node.js (Bun runtime)
- Express 4 + TypeScript
- Prisma 5 ORM + PostgreSQL
- JWT (access + refresh) + bcryptjs
- ExcelJS (Excel export), custom PDF generator
- Zod (shared schema validation)

### Shared (`packages/shared`)

- Ortak TypeScript tipleri
- Zod schemaları (customer / quotation / activity / auth)
- Sabitler (roller, lookup kategorileri, teklif durumları)

### Araçlar

- **Paket yöneticisi:** Bun (workspace tabanlı)
- **DB:** PostgreSQL
- **Deployment:** Vercel (web) + Railway/Render (api) + Neon/Supabase (db) — opsiyonel

---

## Mimari

```
nakliye-crm/
├── apps/
│   ├── web/          React + Vite frontend (port 5174)
│   └── api/          Express + Prisma backend (port 4100)
├── packages/
│   └── shared/       Ortak tipler, Zod şemaları, sabitler
├── Docs/
│   └── Nakliye-CRM-PRD-v3.md
└── package.json      Bun workspace root
```

Backend katmanı: `routes → middleware (auth + rbac + validate) → controller → prisma`. Her mutasyon `createAuditLog()` ile denetim kaydı üretir. Otomatik alanlar (`lastContactDate`, `lastQuoteDate`, `revisionCount`) transaction içinde güncellenir.

Frontend katmanı: `pages → components (ui + feature) → services (axios) → stores (zustand persist)`. Auth guard'lı route'lar (`ProtectedRoute`, `AdminRoute`) + tema guard'ı.

---

## Kurulum

### Ön Gereksinimler

- [Bun](https://bun.sh) ≥ 1.2
- PostgreSQL 14+ (lokal veya cloud — örn. Neon)

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/hikmetgulsesli/nakliye-crm.git
cd nakliye-crm

# 2. Bağımlılıkları kur (tüm workspace'ler)
bun install

# 3. Ortam değişkenlerini kopyala
cp .env.example .env                    # root (opsiyonel, workspaces için ortak)
cp apps/api/.env.example apps/api/.env  # api için zorunlu

# 4. apps/api/.env dosyasında DATABASE_URL ve JWT_SECRET'ları ayarla
#    Örnek: postgresql://user:pass@localhost:5432/nakliye_crm

# 5. Prisma client üret
bun run db:generate

# 6. Migration'ları çalıştır (şemayı DB'ye uygula)
bun run db:migrate

# 7. Seed (admin + 3 satış temsilcisi + tüm lookup kategorileri)
bun run db:seed
```

---

## Çalıştırma

### Geliştirme (iki sunucu eş zamanlı)

```bash
bun run dev
```

- Web: http://localhost:5174
- API: http://localhost:4100
- Vite proxy: `/api/*` → `http://localhost:4100`

### Tek bir app

```bash
bun run dev:web    # sadece frontend
bun run dev:api    # sadece backend (Bun --watch ile hot reload)
```

### Prisma Studio (veritabanı GUI)

```bash
bun run db:studio
```

### Üretim Build

```bash
bun run build
```

---

## Varsayılan Hesaplar

`bun run db:seed` sonrası erişilebilir:

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | `admin@nakliyecrm.com` | `Admin123!` |
| Kullanıcı | `ahmet@nakliyecrm.com` | `User123!` |
| Kullanıcı | `ayse@nakliyecrm.com` | `User123!` |
| Kullanıcı | `mehmet@nakliyecrm.com` | `User123!` |

> Production'da seed sonrası şifreleri değiştirin.

---

## Kullanışlı Komutlar

```bash
# Database
bun run db:generate    # Prisma client üret
bun run db:migrate     # Yeni migration oluştur + uygula (dev)
bun run db:seed        # Seed verilerini yükle (idempotent, upsert)
bun run db:studio      # Prisma Studio GUI

# Development
bun run dev            # Web + API paralel
bun run dev:web        # Sadece web
bun run dev:api        # Sadece api

# Build
bun run build          # Tüm workspace'leri build et

# TypeScript check
(cd apps/web && bunx tsc --noEmit)
(cd apps/api && bunx tsc --noEmit)

# Lint (web)
(cd apps/web && bun run lint)
```

---

## Proje Yapısı

```
apps/web/src/
├── pages/              # Route sayfaları (23 adet)
│   ├── customers/      # Liste / Create / Edit / Detail
│   ├── quotes/         # Liste / Create / Edit / Detail
│   ├── admin/          # Raporlar / Loglar / Kullanıcılar / Lookup / Devir
│   └── ...             # Dashboard, Profil, Login, Marketing
├── components/
│   ├── ui/             # Design system (Button, Input, Modal, Table, ...)
│   ├── layout/         # AppLayout, Header, Sidebar, NotificationDropdown
│   ├── dashboard/      # KPI, charts, widgets
│   ├── customers/      # CustomerForm, ConflictWarningModal, tabs
│   ├── quotations/     # QuotationForm, RevisionHistory
│   ├── activities/     # ActivityModal, ActivityTimeline
│   ├── admin/          # TransferForm, AuditLogTable, ReportsPanel, ...
│   └── shared/         # PageHeader, KPICard, JsonDiffViewer
├── services/           # API katmanı (customer, quotation, activity, ...)
├── stores/             # Zustand (auth, theme, notifications, lookups, ui)
├── hooks/              # useDebounce, usePagination, useLookups
├── routes/             # Route tanımları (lazy-loaded)
├── config/             # Axios instance + env
└── utils/              # cn (clsx), formatters

apps/api/src/
├── modules/            # Özellik bazlı modüller
│   ├── auth/           # Login, refresh, 2FA, şifre, profil
│   ├── users/
│   ├── customers/      # + conflict.service.ts
│   ├── quotations/
│   ├── activities/
│   ├── dashboard/      # KPI + alert sorguları
│   ├── reports/        # 5 rapor + PDF/Excel generator
│   ├── lookups/
│   ├── transfers/      # Toplu devir (transaction)
│   ├── audit/
│   └── notifications/  # Scheduler + read/markRead
├── middleware/         # auth, rbac, validate, error-handler
├── config/             # database (Prisma client), env
├── utils/              # audit, diff, pagination, notification-generator
└── app.ts              # Express app + route mount

packages/shared/src/
├── types/              # TypeScript interfaces
├── constants/          # roles, lookup-categories, quote-status
└── validators/         # Zod şemaları (auth, customer, quotation, activity)
```

---

## Ortam Değişkenleri

### `apps/api/.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nakliye_crm"
JWT_SECRET="en-az-32-karakter-gizli-anahtar"
JWT_REFRESH_SECRET="en-az-32-karakter-ayri-gizli-anahtar"
CORS_ORIGIN="http://localhost:5174"
PORT=4100

# Opsiyonel: E-posta servisi (bildirim gönderimi)
# SENDGRID_API_KEY=
# SMTP_HOST=
```

### `apps/web/.env` (opsiyonel)

```env
# Default: /api (Vite proxy üzerinden backend'e gider)
VITE_API_URL=/api
```

---

## Geliştirme Notları

### Yetki Matrisi (PRD §3)

| İşlem | Admin | Kullanıcı |
|---|---|---|
| Tüm müşteri/teklif/aktivite görüntüleme | ✓ | ✓ |
| Müşteri / teklif / aktivite ekleme-güncelleme | ✓ | ✓ |
| Kayıt silme | ✓ | Yalnız kendi aktivitesi |
| Tüm ekip dashboard'u | ✓ | ✗ |
| Rapor export (PDF/Excel) | ✓ | ✗ |
| Kullanıcı yönetimi | ✓ | ✗ |
| Sistem ayarları (lookup) | ✓ | ✗ |
| Temsilci devir | ✓ | ✗ |
| Log görüntüleme | ✓ | ✗ |

### Çakışma Önleme Algoritması

1. **Firma adı:** Ortak kelime sayımı ile similarity — `%80+` eşik (PRD).
2. **Telefon:** Normalize edilmiş birebir arama (boşluk/tire/parantez temizlenir).
3. **E-posta:** Case-insensitive birebir eşleşme.
4. Gerçek zamanlı: `companyName`, `phone`, `email` alanları 500ms debounced olarak `POST /api/customers/conflict-check` çağırır.
5. Submit'te: eşleşme varsa modal açılır, admin "Yine de Kaydet" ile override edebilir.

### Audit Log

Tüm mutasyonlar (CREATE / UPDATE / DELETE / RESTORE / TRANSFER) `audit_log` tablosuna yazılır. UPDATE'lerde `changes` JSON olarak field-level diff içerir (`{"price": {"old": 2000, "new": 1850}}`). Müşteri detayındaki "Geçmiş" sekmesinde ve `/loglar` admin panelinde görünür.

### Tema

- `useThemeStore` (Zustand) persist ile `localStorage.nakliye-crm-theme` tutar.
- İlk mount'ta `matchMedia('(prefers-color-scheme: dark)')` ile sistem tercihi detect edilir.
- FOUC önlemek için `main.tsx`'te mount'tan ÖNCE `document.documentElement.classList.add('dark')` uygulanır.
- Tüm UI bileşenleri `dark:` Tailwind varyantlarıyla uyumlu.

### Kod Kuralları

- **Dil:** UI metinleri, hata mesajları, DB içeriği **Türkçe**.
- **Paket:** `bun` kullanılır, `npm` değil.
- **Branch:** Direkt `main` (feature branch kullanılmaz, küçük ekiplerde hız için).
- **Placeholder:** "yakinda", disabled state, TODO yorumları **yasak** — tam implemente et ya da çıkar.

---

## Dokümantasyon

- [Ürün Gereksinim Dokümanı (PRD v3)](Docs/Nakliye-CRM-PRD-v3.md) — modül detayları, yetki matrisi, DB şema önerileri, sprint roadmap
- [PRD — Faz 2 (Yapay Zeka)](Docs/Nakliye-CRM-PRD-v3.md#faz-2-yapay-zeka-özellikleri) — MVP sonrası eklenecek: kazanma ihtimali tahmini, teklif e-postası taslağı, kayıp riski uyarısı, koçluk önerileri

---

## Lisans

Özel proje — tüm hakları saklıdır © Hakan Gülsesli.
