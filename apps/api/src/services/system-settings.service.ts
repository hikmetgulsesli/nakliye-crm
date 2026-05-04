import { prisma } from '../config/database';

/**
 * Generic key/value settings store. Values are JSON (any shape).
 * Cached in-process for 60s to avoid DB hit on every request.
 * Cache invalidated on setSetting.
 */

type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) {
    return hit.value as T | null;
  }
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const value = (row?.value ?? null) as T | null;
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

export async function setSetting(
  key: string,
  value: unknown,
  updatedBy?: number,
): Promise<void> {
  // SystemSetting.value JSON-non-null; null/undefined = ayar silme demek.
  // Bu sayede 'reset to default' davranisi natural calisir.
  if (value === null || value === undefined) {
    await prisma.systemSetting
      .delete({ where: { key } })
      .catch(() => undefined); // var degilse sessizce gec
    cache.delete(key);
    return;
  }
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: value as object, updatedBy },
    create: { key, value: value as object, updatedBy },
  });
  cache.delete(key);
}

export async function getManySettings(
  keys: string[],
): Promise<Record<string, unknown>> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = null;
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function listByPrefix(prefix: string): Promise<Record<string, unknown>> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: prefix } },
  });
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function clearSettingsCache(): void {
  cache.clear();
}
