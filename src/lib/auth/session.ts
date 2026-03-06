import { getServerSession } from 'next-auth';
import { authOptions } from './index';
import { cookies } from 'next/headers';
import type { Session } from '@/types';

const SESSION_COOKIE = 'session';

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

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
}
