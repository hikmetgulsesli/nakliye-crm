import crypto from 'crypto';
import { getSetting, setSetting } from './system-settings.service';
import { logger } from '../config/logger';

/**
 * Hassas degerleri (API key, DSN, credentials) AES-256-GCM ile sifreleyip
 * SystemSetting tablosunda saklar.
 *
 * Master key: env'deki SECRETS_MASTER_KEY (32 byte hex veya base64).
 * Yoksa JWT_SECRET hash'i kullanilir — guvenlik icin production'da
 * kesinlikle explicit set edilmeli.
 */

interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  lastFour: string; // son 4 karakter (UI'da "•••• xXyZ" gosterimi icin)
  updatedAt: string;
}

function getMasterKey(): Buffer {
  const raw =
    process.env.SECRETS_MASTER_KEY ||
    process.env.JWT_SECRET ||
    'fallback-insecure-key-do-not-use-in-production';
  // 32 byte olmasi icin sha-256 ile hash
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(plaintext: string): EncryptedSecret {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    lastFour: plaintext.slice(-4),
    updatedAt: new Date().toISOString(),
  };
}

function decrypt(enc: EncryptedSecret): string {
  const key = getMasterKey();
  const iv = Buffer.from(enc.iv, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const ciphertext = Buffer.from(enc.ciphertext, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

function settingKey(name: string): string {
  return `secrets.${name}`;
}

/**
 * Hassas degeri guvenli sakla. Bos string silme anlamina gelir.
 */
export async function setSecret(name: string, plaintext: string, userId?: number): Promise<void> {
  if (!plaintext || plaintext.trim() === '') {
    await setSetting(settingKey(name), null, userId);
    return;
  }
  const enc = encrypt(plaintext);
  await setSetting(settingKey(name), enc as unknown as object, userId);
}

/**
 * Hassas degeri oku. Oncelik: env > DB.
 * Bu sayede prod'da env zorlayabilir, dev/local'de UI'dan girebilirsin.
 */
export async function getSecret(name: string, envVarName?: string): Promise<string | null> {
  // 1) Env oncelik
  if (envVarName && process.env[envVarName]) {
    return process.env[envVarName] as string;
  }
  // 2) DB
  const stored = await getSetting<EncryptedSecret>(settingKey(name));
  if (!stored || !stored.ciphertext) return null;
  try {
    return decrypt(stored);
  } catch (err) {
    logger.warn({ err: (err as Error).message, name }, 'Secret decrypt basarisiz');
    return null;
  }
}

/**
 * UI'a gostermek icin masked durum (key var mi + son 4 char).
 * Plain text dondurmez.
 */
export interface SecretStatus {
  configured: boolean;
  source: 'env' | 'db' | null;
  lastFour: string | null;
  updatedAt: string | null;
}

export async function getSecretStatus(name: string, envVarName?: string): Promise<SecretStatus> {
  if (envVarName && process.env[envVarName]) {
    const val = process.env[envVarName] as string;
    return {
      configured: true,
      source: 'env',
      lastFour: val.slice(-4),
      updatedAt: null,
    };
  }
  const stored = await getSetting<EncryptedSecret>(settingKey(name));
  if (!stored || !stored.ciphertext) {
    return { configured: false, source: null, lastFour: null, updatedAt: null };
  }
  return {
    configured: true,
    source: 'db',
    lastFour: stored.lastFour,
    updatedAt: stored.updatedAt,
  };
}

/**
 * Tum secret'larin mevcut durum ozeti.
 */
export const SECRET_NAMES = [
  // AI
  { name: 'anthropic_api_key', envVar: 'ANTHROPIC_API_KEY', label: 'Claude (Anthropic) API Key', category: 'ai' },
  { name: 'openai_api_key', envVar: 'OPENAI_API_KEY', label: 'OpenAI API Key', category: 'ai' },
  { name: 'minimax_api_key', envVar: 'MINIMAX_API_KEY', label: 'MiniMax API Key', category: 'ai' },
  { name: 'kimi_api_key', envVar: 'KIMI_API_KEY', label: 'Kimi (Moonshot) API Key', category: 'ai' },
  // Email
  { name: 'resend_api_key', envVar: 'RESEND_API_KEY', label: 'Resend API Key (e-posta)', category: 'email' },
  { name: 'smtp_host', envVar: 'SMTP_HOST', label: 'SMTP Host', category: 'email' },
  { name: 'smtp_user', envVar: 'SMTP_USER', label: 'SMTP Kullanıcı', category: 'email' },
  { name: 'smtp_password', envVar: 'SMTP_PASSWORD', label: 'SMTP Şifre', category: 'email' },
  // Channels
  { name: 'twilio_account_sid', envVar: 'TWILIO_ACCOUNT_SID', label: 'Twilio Account SID', category: 'channels' },
  { name: 'twilio_auth_token', envVar: 'TWILIO_AUTH_TOKEN', label: 'Twilio Auth Token', category: 'channels' },
  { name: 'twilio_whatsapp_from', envVar: 'TWILIO_WHATSAPP_FROM', label: 'Twilio WhatsApp From', category: 'channels' },
  { name: 'netgsm_user', envVar: 'NETGSM_USER', label: 'Netgsm Kullanıcı', category: 'channels' },
  { name: 'netgsm_password', envVar: 'NETGSM_PASSWORD', label: 'Netgsm Şifre', category: 'channels' },
  // Storage
  { name: 's3_endpoint', envVar: 'S3_ENDPOINT', label: 'S3/R2 Endpoint URL', category: 'storage' },
  { name: 's3_bucket', envVar: 'S3_BUCKET', label: 'S3/R2 Bucket', category: 'storage' },
  { name: 's3_access_key_id', envVar: 'S3_ACCESS_KEY_ID', label: 'S3/R2 Access Key', category: 'storage' },
  { name: 's3_secret_access_key', envVar: 'S3_SECRET_ACCESS_KEY', label: 'S3/R2 Secret Key', category: 'storage' },
  // Observability
  { name: 'sentry_dsn', envVar: 'SENTRY_DSN', label: 'Sentry DSN', category: 'observability' },
  // IMAP
  { name: 'imap_host', envVar: 'IMAP_HOST', label: 'IMAP Host', category: 'email' },
  { name: 'imap_user', envVar: 'IMAP_USER', label: 'IMAP Kullanıcı', category: 'email' },
  { name: 'imap_password', envVar: 'IMAP_PASSWORD', label: 'IMAP Şifre', category: 'email' },
] as const;

export const SECRET_CATEGORIES: Record<string, string> = {
  ai: 'AI Sağlayıcı Anahtarları',
  email: 'E-posta Servisi',
  channels: 'WhatsApp / SMS',
  storage: 'Object Storage (R2/S3)',
  observability: 'Gözlemlenebilirlik',
};

export async function listSecretStatus() {
  const result = [];
  for (const s of SECRET_NAMES) {
    const status = await getSecretStatus(s.name, s.envVar);
    result.push({ ...s, ...status });
  }
  return result;
}
