<<<<<<< HEAD
import type { Session } from '@/types';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session;
    
    // Check if session is expired
    if (new Date(session.expires) < new Date()) {
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(session.expires),
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Alias for backward compatibility
export async function clearSessionCookie(): Promise<void> {
  return clearSession();
=======
import { getServerSession } from 'next-auth';
import { authOptions } from './index';

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    user: {
      id: session.user.id as string,
      email: session.user.email as string,
      full_name: session.user.name as string,
      role: session.user.role as 'admin' | 'user',
    },
    expires: session.expires,
  };
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
}
