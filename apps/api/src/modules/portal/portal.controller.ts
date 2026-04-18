import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler';
import { sendEmailNow } from '../../services/email';

/**
 * Müşteri portalı — OTP ile giriş. Şifre yok (güvenlik + basitlik).
 * JWT access token 24h.
 */

// In-memory OTP store (prod'da Redis ile degisebilir)
const otpStore = new Map<string, { code: string; expiresAt: number; customerId: number }>();

const OTP_TTL_MS = 10 * 60 * 1000;
const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'portal-secret';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOtp(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  if (!email) throw new AppError('email gerekli', 400);

  const customer = await prisma.customer.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, isDeleted: false },
  });
  // Enumeration koruma: cevap her zaman 200
  if (customer) {
    const code = generateOtp();
    otpStore.set(email.toLowerCase(), {
      code,
      customerId: customer.id,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const html = `
      <div style="font-family:sans-serif;padding:20px">
        <h2>Nakliye CRM — Müşteri Portal Girişi</h2>
        <p>Giriş kodunuz:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:6px;padding:16px;background:#f1f5f9;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#64748b;font-size:13px">Bu kod 10 dakika geçerlidir.</p>
      </div>
    `;
    try {
      await sendEmailNow({
        to: email,
        subject: `[Nakliye CRM Portal] Giriş kodu: ${code}`,
        html,
      });
    } catch {
      // E-posta saglayicisi yoksa sessiz gec — dev icin console
      console.log(`[Portal OTP] ${email} → ${code}`);
    }
  }

  res.json({ success: true, message: 'Kod e-posta adresinize gönderildi.' });
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, code } = req.body as { email: string; code: string };
  if (!email || !code) throw new AppError('email ve code gerekli', 400);

  const key = email.toLowerCase();
  const entry = otpStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new AppError('Geçersiz veya süresi dolmuş kod', 401);
  }
  if (entry.code !== code) {
    throw new AppError('Geçersiz kod', 401);
  }

  otpStore.delete(key);

  const token = jwt.sign(
    { customerId: entry.customerId, email: key, portal: true },
    PORTAL_JWT_SECRET,
    { expiresIn: '24h' },
  );

  res.json({ success: true, data: { token, customerId: entry.customerId } });
}

/**
 * Portal middleware — portal JWT'sini dogrular ve req.portalCustomerId'yi set eder.
 */
declare global {
  namespace Express {
    interface Request {
      portalCustomerId?: number;
    }
  }
}

export function portalAuth(req: Request, res: Response, next: () => void) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Yetkilendirme gerekli' });
    return;
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], PORTAL_JWT_SECRET) as {
      customerId: number;
      portal: boolean;
    };
    if (!payload.portal) throw new Error('invalid');
    req.portalCustomerId = payload.customerId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Geçersiz token' });
  }
}

export async function me(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.portalCustomerId! },
    select: { id: true, companyName: true, contactName: true, email: true, phone: true },
  });
  res.json({ success: true, data: customer });
}

export async function myQuotations(req: Request, res: Response) {
  const quotations = await prisma.quotation.findMany({
    where: { customerId: req.portalCustomerId!, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      quoteNo: true,
      quoteDate: true,
      validityDate: true,
      transportMode: true,
      originCountry: true,
      destinationCountry: true,
      price: true,
      currency: true,
      status: true,
    },
  });
  res.json({ success: true, data: quotations });
}

export async function myShipments(req: Request, res: Response) {
  const shipments = await prisma.shipment.findMany({
    where: { customerId: req.portalCustomerId!, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      shipmentNo: true,
      blNumber: true,
      transportMode: true,
      originCountry: true,
      pol: true,
      destinationCountry: true,
      pod: true,
      etd: true,
      eta: true,
      status: true,
    },
  });
  res.json({ success: true, data: shipments });
}
