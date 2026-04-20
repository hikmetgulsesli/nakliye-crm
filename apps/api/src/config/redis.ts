import IORedis from 'ioredis';
import { logger } from './logger';

let client: IORedis | null = null;
let givenUp = false;
let logThrottle = 0;
let connectivityCache: { ok: boolean; at: number } | null = null;
const CONNECTIVITY_TTL_MS = 60_000;

/**
 * Redis acik mi kontrolu — env, SystemSetting, runtime kill-switch birlikte.
 * USE_REDIS=false env > DB setting 'infrastructure.redis_enabled' > default true
 */
export async function isRedisEnabled(): Promise<boolean> {
  if (process.env.USE_REDIS === 'false') return false;
  try {
    const { getSetting } = await import('../services/system-settings.service');
    const v = await getSetting<boolean>('infrastructure.redis_enabled');
    return v !== false;
  } catch {
    return true;
  }
}

/**
 * Boot'ta veya setting degistiginde CANLI bir kisa test —
 * 2 saniye timeout, log spam yapmaz. Sonuc 60sn cache.
 * Basarisizsa false doner, BullMQ worker'lari baslamaz.
 */
export async function testRedisConnectivity(force = false): Promise<boolean> {
  if (!force && connectivityCache && Date.now() - connectivityCache.at < CONNECTIVITY_TTL_MS) {
    return connectivityCache.ok;
  }
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const testClient = new IORedis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: () => null,
    reconnectOnError: () => false,
    enableReadyCheck: false,
  });
  testClient.on('error', () => {}); // log bombasi onleme

  try {
    await testClient.connect();
    await testClient.ping();
    connectivityCache = { ok: true, at: Date.now() };
    testClient.disconnect();
    return true;
  } catch {
    connectivityCache = { ok: false, at: Date.now() };
    try {
      testClient.disconnect();
    } catch {
      // ignore
    }
    return false;
  }
}

/** connectivityCache'i invalidate et (setting degistiginde cagirilir) */
export function invalidateRedisConnectivityCache(): void {
  connectivityCache = null;
  givenUp = false;
  logThrottle = 0;
}

export function getRedis(): IORedis {
  if (client) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      if (givenUp) return null;
      if (times > 8) {
        givenUp = true;
        logger.warn(
          'Redis 8 denemede bağlanamadı — yeniden deneme durduruldu. ' +
            'Sistem Ayarları > Genel > "Redis" kapatılabilir veya sunucu env düzeltilebilir.',
        );
        return null;
      }
      return Math.min(times * 500, 5000);
    },
    reconnectOnError() {
      return !givenUp;
    },
  });

  client.on('error', (err) => {
    if (logThrottle % 10 === 0) {
      logger.warn({ err: err.message, suppressed: logThrottle }, 'Redis hata');
    }
    logThrottle++;
  });
  client.on('connect', () => {
    givenUp = false;
    logThrottle = 0;
    logger.info('Redis bagli');
  });
  client.on('end', () => {
    logger.debug('Redis baglanti kapatildi');
  });

  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    givenUp = true;
    try {
      client.disconnect();
    } catch {
      // ignore
    }
    client = null;
  }
}

export async function forceCloseRedis(): Promise<void> {
  await closeRedis();
  invalidateRedisConnectivityCache();
}
