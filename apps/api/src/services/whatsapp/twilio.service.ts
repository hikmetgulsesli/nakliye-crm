import twilio from 'twilio';
import { logger } from '../../config/logger';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN tanimli degil');
  client = twilio(sid, token);
  return client;
}

export function isTwilioConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

function defaultFromWhatsApp(): string {
  return process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
}

/**
 * Belirli bir musteri telefonuna WhatsApp mesaji gonderir.
 */
export async function sendWhatsApp(to: string, body: string): Promise<{ sid: string }> {
  const c = getClient();
  const normalized = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : '+' + to.replace(/\s/g, '')}`;
  const msg = await c.messages.create({
    from: defaultFromWhatsApp(),
    to: normalized,
    body,
  });
  logger.info({ sid: msg.sid, to: normalized }, 'WhatsApp mesaj gonderildi');
  return { sid: msg.sid };
}

/**
 * Twilio webhook: gelen mesaj → Activity olarak kaydet.
 */
export interface InboundWaPayload {
  From: string; // whatsapp:+90...
  To: string;
  Body: string;
  MessageSid: string;
  ProfileName?: string;
}
