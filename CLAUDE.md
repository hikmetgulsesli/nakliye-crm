# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje

Uluslararası nakliye operasyonları için Türkçe web CRM. Müşteri çakışma önleme, teklif yönetimi, aktivite takibi, raporlama ve denetim modüllerini kapsar. Detaylı ürün tanımı: `Docs/Nakliye-CRM-PRD-v3.md`. Son kullanıcı odaklı tanıtım: `README.md`.

## Komutlar

Tüm komutlar **Bun** ile çalıştırılır — `npm`/`pnpm`/`yarn` kullanma. Kök `package.json` workspace filtreleriyle apps/api ve apps/web'e yönlendirir.

```bash
bun install                      # Tüm workspace'ler
bun run dev                      # Web (5174) + API (4100) paralel
bun run dev:api                  # Sadece API (bun --watch ile hot reload)
bun run dev:web                  # Sadece Vite

bun run db:generate              # Prisma client
bun run db:migrate               # prisma migrate dev (yeni migration + uygula)
bun run db:seed                  # prisma/seed.ts (idempotent upsert)
bun run db:studio                # Prisma Studio

bun run build                    # Tüm workspace'ler
bun run typecheck                # Tüm workspace'ler tsc --noEmit
bun run test                     # Vitest (api + web)

# Tek app typecheck/test
(cd apps/api && bunx tsc --noEmit)
(cd apps/web && bun run lint)
(cd apps/api && bun run test)    # Vitest run
(cd apps/web && bun run test)    # Vitest run
bun x vitest run path/to/file    # Tek dosya

# E2E (Playwright — dev sunucuları ÖNCEDEN çalışıyor olmalı; config webServer başlatmaz)
bun run dev                      # Önce başka terminalde
bun run e2e                      # Veya e2e:ui / e2e:debug

# Docker
docker compose up --build                            # Harici DB (DATABASE_URL zorunlu)
docker compose --profile embedded-db up --build      # Lokal postgres container'ı da ayağa kaldırır
```

Port 4100 (API) ve 5174 (Web) sabitlenmiştir — değiştirilirse Vite proxy, Playwright baseURL ve API `PORT` env birlikte güncellenmeli.

## Mimari

### Monorepo Düzeni

Bun workspaces: `apps/api` (Express + Prisma), `apps/web` (React + Vite), `packages/shared` (Zod şemaları, TypeScript tipleri, sabitler). Shared paketi `@nakliye-crm/shared` olarak import edilir ve hem frontend hem backend Zod şemalarını oradan alır — **validation kuralları tek kaynakta** tutulur.

### Backend İstek Akışı

Her endpoint şu zincirden geçer:

```
routes  →  auth()  →  rbac('ADMIN'|'USER')  →  validate(zodSchema)  →  controller  →  prisma
```

- `auth()` (apps/api/src/middleware/auth.ts): Bearer JWT doğrular, `req.user = { userId, role, email }` set eder.
- `rbac('ADMIN', …)` (middleware/rbac.ts): rol kontrolü; opsiyonel.
- `validate(schema)` (middleware/validate.ts): `req.body`'i Zod ile doğrular ve parse edilmiş dataya overwrite eder. Hata formatı: `{ success: false, message: 'Validasyon hatasi', errors: { 'path': [mesajlar] } }`.
- `app.ts`: 35+ modülü `/api/<module>` altında mount eder; `/api/docs` Swagger UI, `/api/openapi.json` spec, production'da SPA fallback (`/api/*` dışı GET → `apps/web/dist/index.html`).

**Değişmez kural:** Her mutation (CREATE/UPDATE/DELETE/RESTORE/TRANSFER) `apps/api/src/utils/audit.ts` içindeki `createAuditLog()` yardımıyla `audit_log` tablosuna yazılmak zorundadır. UPDATE'lerde `changes` JSON olarak field-level diff içerir: `{ "price": { "old": 2000, "new": 1850 } }`. Bu invariant müşteri detayının "Geçmiş" sekmesi ve `/loglar` admin paneli için kritiktir.

**Otomatik alanlar** (`lastContactDate`, `lastQuoteDate`, `revisionCount`) controller'larda değil, **ilgili transaction içinde** güncellenir. Yeni bir mutation yazarken bu alanların bozulmadığından emin ol.

### Çakışma Önleme (customers)

`POST /api/customers/conflict-check` endpoint'i `apps/api/src/modules/customers/conflict.service.ts` içinden gelir. Frontend formları 500ms debounced çağırır; submit'te eşleşme varsa modal açılır, ADMIN "Yine de Kaydet" ile override edebilir. Algoritma: firma adı ortak kelime similarity ≥ %80, telefon normalize edilip birebir, e-posta case-insensitive birebir.

### Workers & Redis (kritik — debug davranışını değiştirir)

`apps/api/src/workers/index.ts` boot'ta şu zinciri uygular:

1. `isRedisEnabled()` (config/redis.ts): `USE_REDIS=false` env > `SystemSetting 'infrastructure.redis_enabled'` > default `true`.
2. Aktifse `testRedisConnectivity(force=true)` — 2sn timeout'lu tek PING; 60sn boyunca cache'lenir.
3. Bağlanamazsa **in-process setInterval fallback** (`utils/notification-generator.ts` → `startNotificationScheduler`) devreye girer. BullMQ worker'ları başlamaz.

Bu tasarım log spam'ini önler. Redis erişilemezken retry bombası atmamak için `invalidateRedisConnectivityCache()` yalnızca ayar değişiminde çağrılmalıdır. Kuyruklar: `notifications`, `emails`, `daily-digest`, `churn-risk`, `tcmb` (TCMB kuru), `imap` (e-posta çekme). Socket.IO aynı HTTP server üzerinde (`realtime/socket.ts`).

### Log Konvansiyonu

`pino-http` seviyeleri `app.ts`'de özelleştirilmiştir: **401/403 → debug** (beklenen auth davranışı), 4xx → warn, 5xx/hata → error. `/api/health` loglanmaz. Yeni middleware eklerken bu sessizleştirmeyi bozmamaya dikkat — ortamı log bombasına çeviren son birkaç commit'in amacı buydu.

### Frontend Akışı

`pages → components (ui + feature) → services (axios) → stores (zustand persist)`. Her route lazy-loaded (`src/routes/index.ts`). Auth guard'lar: `ProtectedRoute`, `AdminRoute`.

- **Axios instance** (`src/config/axios.ts`): refresh token interceptor, 401'de `/api/auth/refresh` çağırır, sırada bekleyen istekleri queue'lar.
- **Stores** (Zustand persist): `authStore` (token + user), `themeStore`, `notificationStore`, `lookupStore` (dinamik dropdown değerleri), `featuresStore` (feature flag — token yoksa fetch atlanır), `uiStore`.
- **FOUC önleme**: `main.tsx` mount'tan ÖNCE `localStorage.nakliye-crm-theme`'i okur ve `document.documentElement.classList.add('dark')` uygular. Tema toggle'ı veya persist key'i değiştirilirse bu blok da güncellenmeli.
- **i18n**: `react-i18next` + browser detector (UI Türkçe ama altyapı çok dillidir).

### Dinamik Alanlar

Ülke listesi, incoterm, nakliye modu gibi dropdown değerleri **koda gömülmez**; `lookup_values` tablosundan `src/modules/lookups/` üzerinden gelir. Yeni bir tür eklemek için migration + seed güncellemesi + `packages/shared/src/constants/` içinde kategori anahtarı gerekir.

### Teklif Numarası

`apps/api/src/utils/quote-number.ts` → `TKF-<YEAR>-<0001...>` formatı. Yeni yıl açılışında son numara resetlenir. Quotation create'inde bu util çağrılır; direkt DB'ye yazıp atlatma.

### Prisma Şeması

`apps/api/prisma/schema.prisma` (~514 satır) tüm alanlarda `@map("snake_case")` ile DB kolonlarını Pascal/camelCase Prisma alanlarına eşler. `@@map("table_name")` ile tablo adları snake_case. Migration dosyaları `apps/api/prisma/migrations/` — mevcut 11 migration var, yeni migration dev modunda `bun run db:migrate` ile oluşturulur.

## Konvansiyonlar

- **Dil:** UI metinleri, hata mesajları, DB içerik Türkçe. Koddaki identifier'lar İngilizce kalabilir. Türkçe karakterleri (ş, ç, ğ, ü, ö, ı, İ) **ASCII'ye dönüştürme** — migration dosyalarında bile korunur (`20260417160000_turkish_chars` bu amaçla eklenmişti).
- **Dal modeli:** Doğrudan `main`'e commit. Feature branch kullanılmaz.
- **Placeholder yasağı:** "yakında gelecek", disabled dummy button, TODO yorumu **yazma** — ya tam implemente et ya çıkar.
- **Zod şemaları tek kaynakta:** Yeni bir validation kuralı `packages/shared/src/validators/` altında tanımlanmalı, ikisi de oradan import etmeli.
- **Modül dizim standardı:** Backend modülü eklerken `<module>.routes.ts`, `<module>.controller.ts`, opsiyonel `<module>.service.ts` üçlüsünü kopyala; `app.ts`'e `app.use('/api/<module>', ...)` satırını da eklemeyi unutma.
- **Kayıt silme:** Soft delete (`isDeleted = true`) varsayılan; `PATCH /:id/restore` ADMIN'e ayrılmıştır (`apps/api/src/modules/customers/customers.routes.ts` pattern'i).

## Ortam Değişkenleri

İki ayrı .env vardır:
- `apps/api/.env` → **sadece lokal `bun run dev:api`** için (`apps/api/src/config/env.ts` tarafından okunur).
- Kök `.env` → **Docker/production** için; `docker-compose.yml` buradan okur.

Zorunlu: `DATABASE_URL`, `JWT_SECRET` (32+ karakter), `JWT_REFRESH_SECRET`. Opsiyonel: `REDIS_URL`, `USE_REDIS`, `CORS_ORIGIN`, `DISABLE_SEED` (ilk deploy sonrası `1`'e çekerek seed'in şifre override'lamasını engelle), `SENTRY_DSN`, `APP_PORT` (host portu).

**API key'ler UI'dan girilebilir:** `src/services/secrets.service.ts` AES-256-GCM ile şifreleyip DB'ye yazar; env değeri varsa DB'yi override eder. Yeni bir dış servis entegrasyonu eklerken env-only varsayma — settings tablosuna da bak.

## Test

- **Unit (Vitest):** `apps/api/src/**/*.test.ts` + `apps/web/src/**/*.test.ts`. `bun run test` ile hepsi tek tek çalışır (root scripti workspace filtreli).
- **E2E (Playwright):** `e2e/` klasörü, `playwright.config.ts` kökte. `baseURL=http://localhost:5174`, `workers=1`, `fullyParallel=false`. **Config webServer başlatmaz** — `bun run dev`'i başka terminalde önceden çalıştır, sonra `bun run e2e`. CI'da 2 retry, lokal'de 0.
- **Seed hesapları:** `admin@nakliyecrm.com / Admin123!`, `ahmet@ / ayse@ / mehmet@nakliyecrm.com / User123!`.
