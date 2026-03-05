import type { Session } from '@/types';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';

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
