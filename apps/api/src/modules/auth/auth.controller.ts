import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import * as tokenService from './token.service';
import { AppError } from '../../middleware/error-handler';

export async function login(req: Request, res: Response) {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError('Gecersiz e-posta veya sifre', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Gecersiz e-posta veya sifre', 401);
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
    throw new AppError('Refresh token bulunamadi', 401);
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
  res.json({ success: true, message: 'Cikis yapildi' });
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
