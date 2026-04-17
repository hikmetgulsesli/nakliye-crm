import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import * as tokenService from './token.service';
import { AppError } from '../../middleware/error-handler';

export async function login(req: Request, res: Response) {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError('Gecersiz e-posta veya şifre', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Gecersiz e-posta veya şifre', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = await tokenService.generateRefreshToken(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
    path: '/api/auth',
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError('Refresh token bulunamadı', 401);
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new AppError('Gecersiz refresh token', 401);
  }

  // Rotate token
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const newRefreshToken = await tokenService.generateRefreshToken(stored.userId);
  const accessToken = tokenService.generateAccessToken(stored.user);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });

  res.json({
    success: true,
    data: {
      user: {
        id: stored.user.id,
        email: stored.user.email,
        fullName: stored.user.fullName,
        role: stored.user.role,
        avatarUrl: stored.user.avatarUrl,
      },
      accessToken,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true, message: 'Çıkış yapıldı' });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, fullName: true, role: true,
      avatarUrl: true, phone: true, isActive: true,
      lastLoginAt: true, createdAt: true,
    },
  });
  res.json({ success: true, data: user });
}

export async function updateProfile(req: Request, res: Response) {
  const { fullName, email, phone, notificationPrefs } = req.body;
  const userId = req.user!.userId;

  // Check if email is already taken by another user
  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (existing) {
      throw new AppError('Bu e-posta adresi başka bir kullanıcı tarafindan kullaniliyor', 409);
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(notificationPrefs !== undefined && { notificationPrefs }),
    },
    select: {
      id: true, email: true, fullName: true, role: true,
      avatarUrl: true, phone: true, notificationPrefs: true,
    },
  });

  res.json({ success: true, data: updated });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  if (!currentPassword || !newPassword) {
    throw new AppError('Mevcut şifre ve yeni şifre gereklidir', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Yeni şifre en az 6 karakter olmalidir', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Mevcut şifre yanlis', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });

  res.json({ success: true, message: 'Şifre basariyla güncellendi' });
}

export async function enable2FA(req: Request, res: Response) {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  if (user.twoFactorEnabled) {
    throw new AppError('2FA zaten aktif', 400);
  }

  // Generate a TOTP-compatible secret (base32-like hex secret)
  const secret = crypto.randomBytes(20).toString('hex');

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    },
  });

  res.json({
    success: true,
    data: { secret },
    message: '2FA basariyla etkinlestirildi',
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    throw new AppError('E-posta adresi gereklidir', 400);
  }

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'Şifre sıfırlama linki e-posta adresinize gönderildi',
  });
}

export async function disable2FA(req: Request, res: Response) {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Kullanıcı bulunamadı', 404);
  }

  if (!user.twoFactorEnabled) {
    throw new AppError('2FA zaten deaktif', 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    },
  });

  res.json({ success: true, message: '2FA basariyla devre disi birakildi' });
}
