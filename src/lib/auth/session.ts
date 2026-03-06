import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User, Session } from '@/types/index';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nakliye-crm-secret-key-min-32-chars-long'
);

export async function createSession(user: User): Promise<string> {
  const token = await new SignJWT({ userId: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
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

  // Fetch user from database
  const { getUserById } = await import('@/lib/db/users');
  const user = getUserById(payload.userId);
  
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
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