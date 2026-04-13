import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

interface UserForToken {
  id: number;
  email: string;
  role: string;
}

export function generateAccessToken(user: UserForToken): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwtSecret as jwt.Secret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function generateRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}
