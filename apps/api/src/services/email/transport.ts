import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../../config/logger';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailSendResult {
  provider: 'resend' | 'smtp';
  messageId?: string;
}

let resendClient: Resend | null = null;
let smtpClient: Transporter | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function getSmtp(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!smtpClient) {
    smtpClient = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });
  }
  return smtpClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export function defaultFromAddress(): string {
  return (
    process.env.EMAIL_FROM_ADDRESS ||
    'Nakliye CRM <noreply@nakliye.setrox.com.tr>'
  );
}

export async function sendEmail(msg: EmailMessage): Promise<EmailSendResult> {
  const from = msg.from || defaultFromAddress();

  // Prefer Resend if configured
  const resend = getResend();
  if (resend) {
    const res = await resend.emails.send({
      from,
      to: Array.isArray(msg.to) ? msg.to : [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
      cc: msg.cc ? (Array.isArray(msg.cc) ? msg.cc : [msg.cc]) : undefined,
      bcc: msg.bcc ? (Array.isArray(msg.bcc) ? msg.bcc : [msg.bcc]) : undefined,
    });
    if (res.error) {
      throw new Error(`Resend gönderim hatasi: ${res.error.message}`);
    }
    logger.info({ messageId: res.data?.id, provider: 'resend' }, 'E-posta gonderildi');
    return { provider: 'resend', messageId: res.data?.id };
  }

  // SMTP fallback
  const smtp = getSmtp();
  if (smtp) {
    const info = await smtp.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
      cc: msg.cc,
      bcc: msg.bcc,
    });
    logger.info({ messageId: info.messageId, provider: 'smtp' }, 'E-posta gonderildi');
    return { provider: 'smtp', messageId: info.messageId };
  }

  throw new Error(
    'E-posta saglayicisi yapilandirilmamis. RESEND_API_KEY veya SMTP_HOST env\'de ayarlayin.',
  );
}
