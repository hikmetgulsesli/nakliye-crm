import { logger } from '../../config/logger';

/**
 * Netgsm SMS gonderimi — basit HTTP API cagrisi (OTP/hatirlatma icin).
 * Env: NETGSM_USER, NETGSM_PASSWORD, NETGSM_HEADER (default "NakliyeCRM")
 *
 * Dokuman: https://www.netgsm.com.tr
 */

const BASE = 'https://api.netgsm.com.tr/sms/send/otp';

export function isNetgsmConfigured(): boolean {
  return Boolean(process.env.NETGSM_USER && process.env.NETGSM_PASSWORD);
}

export async function sendSMS(phone: string, message: string): Promise<{ ok: boolean; response: string }> {
  const user = process.env.NETGSM_USER;
  const pass = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER || 'NakliyeCRM';
  if (!user || !pass) throw new Error('Netgsm yapilandirilmamis');

  // Netgsm phone 5xxxxxxxxx format bekler (basta sifir olmadan)
  const digits = phone.replace(/[^0-9]/g, '');
  const normalized = digits.startsWith('90') ? digits.slice(2) : digits;

  const params = new URLSearchParams({
    usercode: user,
    password: pass,
    gsmno: normalized,
    message,
    msgheader: header,
  });

  const res = await fetch(`${BASE}?${params.toString()}`);
  const text = await res.text();
  const ok = text.startsWith('00') || text.startsWith('01'); // Netgsm basari kodlari
  logger.info({ phone: normalized, ok, response: text.slice(0, 40) }, 'SMS gonderildi');
  return { ok, response: text };
}
