import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, validatePassword, seedInitialAdmin } from '@/lib/db/users';
import { setSession } from '@/lib/auth/session';
import type { Session } from '@/types';

// Seed initial admin on first request
seedInitialAdmin();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, remember } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = validatePassword(user, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const expires = new Date(Date.now() + (remember ? 30 : 8) * 60 * 60 * 1000);
    const session: Session = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      expires: expires.toISOString(),
    };
    
    await setSession(session);

    return NextResponse.json({
      user: session.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
