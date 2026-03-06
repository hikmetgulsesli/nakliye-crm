import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, validatePassword, seedInitialAdmin } from '@/lib/db/users';
import { createSession, setSessionCookie } from '@/lib/auth/session';

// Track if initial admin seeding has been attempted
let seedingAttempted = false;

export async function POST(request: NextRequest) {
  try {
    // Seed initial admin only once per server startup
    if (!seedingAttempted) {
      seedingAttempted = true;
      try {
        seedInitialAdmin();
      } catch (error) {
        // Log but don't fail - admin might already exist or env not set
        console.log('Admin seeding skipped:', error instanceof Error ? error.message : 'unknown error');
      }
    }

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

    const token = await createSession(user);
    setSessionCookie(token, remember);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
