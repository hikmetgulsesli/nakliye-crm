import { getQueue, QUEUE_NAMES } from '../../workers/queues';
import { sendEmail, type EmailMessage, type EmailSendResult, isEmailConfigured, defaultFromAddress } from './transport';
import { getSetting } from '../system-settings.service';
import { logger } from '../../config/logger';

export * from './transport';
export * from './templates';

/**
 * Hizli kisa yol: e-posta kuyruga ekler (veya ayar kapaliysa atlar).
 * use via: await queueEmail({ to, subject, html, ... })
 */
export async function queueEmail(msg: EmailMessage, opts: { priority?: number } = {}) {
  const enabled = await getSetting<boolean>('email.enabled');
  if (enabled === false) {
    logger.debug({ to: msg.to, subject: msg.subject }, 'email.enabled=false, atlandi');
    return null;
  }
  if (!isEmailConfigured()) {
    logger.warn({ to: msg.to }, 'E-posta saglayicisi yok, kuyruga eklenmedi');
    return null;
  }
  const queue = getQueue(QUEUE_NAMES.emails);
  const job = await queue.add('send', msg, {
    priority: opts.priority,
  });
  return job.id;
}

/**
 * Senkron gonderim — kritik akislar icin (sifre sifirlama gibi).
 */
export async function sendEmailNow(msg: EmailMessage): Promise<EmailSendResult> {
  return sendEmail(msg);
}

export { defaultFromAddress };
