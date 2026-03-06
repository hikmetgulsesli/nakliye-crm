import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User, Session } from '@/types';

const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

export async function createSession(user: User): Promise<string> {
  const token = await new SignJWT({ userId: user.id, role: user.role, full_name: user.full_name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<{ userId: string; role: string; full_name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      full_name: payload.full_name as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  return {
    user: {
      id: payload.userId,
      role: payload.role,
      full_name: payload.full_name,
    } as User,
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

export function setSessionCookie(token: string, remember = false): void {
  const cookieStore = cookies();
  const maxAge = remember ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30 days or 8 hours
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('session');
}
