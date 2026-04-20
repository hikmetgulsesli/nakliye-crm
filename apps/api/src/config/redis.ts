import IORedis from 'ioredis';
import { logger } from './logger';

let client: IORedis | null = null;
let givenUp = false;
let logThrottle = 0;

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

export function getRedis(): IORedis {
  if (client) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    // Toplam 8 deneme, sonra pes et (sürekli yeniden bağlanma loopunu durdurur)
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
    // Throttle: her 10 hatada 1 kere logla (flood önleme)
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

/** UI tarafından çağırılır: toggle sonrası bağlantıyı kes. */
export async function forceCloseRedis(): Promise<void> {
  await closeRedis();
}
