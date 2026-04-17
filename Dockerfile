# ---- Base: Bun + Node compatible runtime ----
FROM oven/bun:1 AS base
WORKDIR /app

# Prisma'nin native binary'leri icin openssl gerekli (debian-bookworm'da mevcut)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Deps katmani: lockfile + package.json'lar ile bun install ----
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

# ---- Builder: Prisma client uretimi + web build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .

# Prisma client (runtime icin native binary)
RUN cd apps/api && bunx prisma generate

# Web static build -> apps/web/dist
RUN cd apps/web && bun run build

# ---- Runtime: minimal ----
FROM base AS runtime
ENV NODE_ENV=production PORT=80
EXPOSE 80

# Source + node_modules + prisma client + built web
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Ilk acilista migration deploy + seed (seed idempotent upsert)
# Seed opsiyonel: DISABLE_SEED=1 ile kapatilabilir
WORKDIR /app/apps/api
CMD ["sh", "-c", "bunx prisma migrate deploy && ([ \"$DISABLE_SEED\" = \"1\" ] || bun run prisma/seed.ts) && bun run src/index.ts"]
