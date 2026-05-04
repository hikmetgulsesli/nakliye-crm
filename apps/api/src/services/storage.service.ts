import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import { logger } from '../config/logger';
import { getSecret } from './secrets.service';

/**
 * Object storage abstraction. Works with Cloudflare R2, AWS S3, MinIO — any
 * S3-compatible provider.
 *
 * Secret kaynaklari (oncelik):
 *   1. process.env (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)
 *   2. SystemSetting (UI'dan girilen, AES-256-GCM ile sifreli)
 * Bu sayede prod'da env zorlanabilir, dev/lokal'de UI'dan girilebilir.
 *
 * Ek opsiyonel env:
 *   S3_REGION              (default: 'auto' — R2 icin uygun)
 *   S3_FORCE_PATH_STYLE    (default: true; 'false' yap = virtual hosted)
 */

interface StorageConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: StorageConfig | null = null;

async function readConfig(): Promise<StorageConfig | null> {
  const endpoint = await getSecret('s3_endpoint', 'S3_ENDPOINT');
  const bucket = await getSecret('s3_bucket', 'S3_BUCKET');
  const accessKeyId = await getSecret('s3_access_key_id', 'S3_ACCESS_KEY_ID');
  const secretAccessKey = await getSecret('s3_secret_access_key', 'S3_SECRET_ACCESS_KEY');
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

function sameConfig(a: StorageConfig | null, b: StorageConfig | null): boolean {
  if (!a || !b) return false;
  return (
    a.endpoint === b.endpoint &&
    a.bucket === b.bucket &&
    a.accessKeyId === b.accessKeyId &&
    a.secretAccessKey === b.secretAccessKey
  );
}

async function ensureClient(): Promise<{ client: S3Client; bucket: string }> {
  const cfg = await readConfig();
  if (!cfg) {
    throw new Error(
      'Object storage yapilandirilmamis. Sistem Ayarlari > API Anahtarlari ekraninda S3/R2 alanlarini doldurun (Endpoint, Bucket, Access Key, Secret Key).',
    );
  }
  if (cachedClient && sameConfig(cachedConfig, cfg)) {
    return { client: cachedClient, bucket: cfg.bucket };
  }
  cachedClient = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  });
  cachedConfig = cfg;
  logger.info({ endpoint: cfg.endpoint, bucket: cfg.bucket }, 'Object storage client hazir');
  return { client: cachedClient, bucket: cfg.bucket };
}

/**
 * Cache'lenmis client'i sifirla — secret guncellemesi sonrasi cagrilir.
 */
export function invalidateStorageCache(): void {
  cachedClient = null;
  cachedConfig = null;
}

export interface UploadKeyOptions {
  ownerType: string; // 'customer' | 'quotation' | 'shipment' | 'avatar' | 'brand'
  ownerId: number | string;
  originalName: string;
}

/**
 * Generate a stable, collision-resistant key.
 * Format: <ownerType>/<ownerId>/<timestamp>-<rand>-<sanitized-name>
 */
export function buildKey(opts: UploadKeyOptions): string {
  const safe = opts.originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const stamp = Date.now();
  const rand = randomBytes(4).toString('hex');
  return `${opts.ownerType}/${opts.ownerId}/${stamp}-${rand}-${safe}`;
}

export async function presignUpload(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ url: string; method: 'PUT' }> {
  const { client, bucket } = await ensureClient();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(client, cmd, { expiresIn: params.expiresIn ?? 900 });
  return { url, method: 'PUT' };
}

export async function presignDownload(params: {
  key: string;
  expiresIn?: number;
  filename?: string;
}): Promise<string> {
  const { client, bucket } = await ensureClient();
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ResponseContentDisposition: params.filename
      ? `attachment; filename="${encodeURIComponent(params.filename)}"`
      : undefined,
  });
  return getSignedUrl(client, cmd, { expiresIn: params.expiresIn ?? 900 });
}

export async function deleteObject(key: string): Promise<void> {
  const { client, bucket } = await ensureClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function headObject(
  key: string,
): Promise<{ size: number; contentType?: string } | null> {
  const { client, bucket } = await ensureClient();
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      size: Number(res.ContentLength ?? 0),
      contentType: res.ContentType,
    };
  } catch {
    return null;
  }
}

export async function isStorageConfigured(): Promise<boolean> {
  const cfg = await readConfig();
  return cfg !== null;
}

/**
 * Connection test: kucuk bir test object yaz, oku, sil. UI'daki "Bağlantı Testi"
 * butonu cagirir; tipik hatalari kullaniciya net hata mesajiyla iletir.
 */
export async function testStorageConnection(): Promise<{
  ok: boolean;
  message: string;
  detail?: { endpoint?: string; bucket?: string; latencyMs?: number };
}> {
  const cfg = await readConfig();
  if (!cfg) {
    return {
      ok: false,
      message:
        'Yapilandirilmamis: Endpoint, Bucket, Access Key ve Secret Key alanlarini doldurun.',
    };
  }

  const started = Date.now();
  const testKey = `_health/test-${Date.now()}-${randomBytes(3).toString('hex')}.txt`;
  const testBody = 'NakliyeCRM storage connectivity test';

  try {
    const { client, bucket } = await ensureClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: testBody,
        ContentType: 'text/plain',
      }),
    );
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
    if (Number(head.ContentLength ?? 0) !== Buffer.byteLength(testBody, 'utf8')) {
      throw new Error('Yazilan ve okunan dosya boyutu eslesmiyor');
    }
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));

    return {
      ok: true,
      message: 'Bağlantı başarılı (yazma + okuma + silme).',
      detail: {
        endpoint: cfg.endpoint,
        bucket: cfg.bucket,
        latencyMs: Date.now() - started,
      },
    };
  } catch (err) {
    const e = err as Error & { Code?: string; $metadata?: { httpStatusCode?: number } };
    let hint = '';
    const code = e.Code || '';
    const status = e.$metadata?.httpStatusCode;
    if (status === 403 || /AccessDenied|SignatureDoesNotMatch|InvalidAccessKeyId/i.test(code)) {
      hint = ' (Access Key veya Secret Key hatali olabilir)';
    } else if (status === 404 || /NoSuchBucket|NotFound/i.test(code)) {
      hint = ' (Bucket bulunamadi — adi dogru mu?)';
    } else if (/EAI_AGAIN|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo/i.test(e.message)) {
      hint = ' (Endpoint URL hatali ya da erisim engellenmis)';
    }
    return {
      ok: false,
      message: `Bağlantı başarısız: ${e.message}${hint}`,
      detail: { endpoint: cfg.endpoint, bucket: cfg.bucket },
    };
  }
}
