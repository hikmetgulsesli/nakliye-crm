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

/**
 * Object storage abstraction. Works with Cloudflare R2, AWS S3, MinIO — any
 * S3-compatible provider. Env:
 *   S3_ENDPOINT            (eg https://<account>.r2.cloudflarestorage.com)
 *   S3_REGION              (default: auto)
 *   S3_BUCKET              (bucket name)
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_FORCE_PATH_STYLE    (default: true for R2/MinIO)
 */

let client: S3Client | null = null;
let bucket: string | null = null;

function ensureClient(): { client: S3Client; bucket: string } {
  if (client && bucket) return { client, bucket };

  const endpoint = process.env.S3_ENDPOINT;
  const bucketEnv = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucketEnv || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Object storage yapilandirilmadi. S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY gerekli.',
    );
  }

  client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  });
  bucket = bucketEnv;
  logger.info({ endpoint, bucket }, 'Object storage client hazir');
  return { client, bucket };
}

export interface UploadKeyOptions {
  ownerType: string; // 'customer' | 'quotation' | 'shipment' | 'avatar'
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
  const { client: c, bucket: b } = ensureClient();
  const cmd = new PutObjectCommand({
    Bucket: b,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(c, cmd, { expiresIn: params.expiresIn ?? 900 });
  return { url, method: 'PUT' };
}

export async function presignDownload(params: {
  key: string;
  expiresIn?: number;
  filename?: string;
}): Promise<string> {
  const { client: c, bucket: b } = ensureClient();
  const cmd = new GetObjectCommand({
    Bucket: b,
    Key: params.key,
    ResponseContentDisposition: params.filename
      ? `attachment; filename="${encodeURIComponent(params.filename)}"`
      : undefined,
  });
  return getSignedUrl(c, cmd, { expiresIn: params.expiresIn ?? 900 });
}

export async function deleteObject(key: string): Promise<void> {
  const { client: c, bucket: b } = ensureClient();
  await c.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
}

export async function headObject(key: string): Promise<{ size: number; contentType?: string } | null> {
  const { client: c, bucket: b } = ensureClient();
  try {
    const res = await c.send(new HeadObjectCommand({ Bucket: b, Key: key }));
    return {
      size: Number(res.ContentLength ?? 0),
      contentType: res.ContentType,
    };
  } catch {
    return null;
  }
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}
