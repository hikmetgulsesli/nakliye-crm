import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getUserByEmail, verifyPassword } from '@/lib/auth/users';
import { createToken } from '@/lib/auth/utils';
import { loginSchema } from '@/lib/validation';

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
=======
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
>>>>>>> origin/feature/crm-core-modules
        { status: 400 }
      );
    }

<<<<<<< HEAD
    const { email, password } = result.data;

    // Find user
    const user = await getUserByEmail(email);

=======
    const user = getUserByEmail(email);
>>>>>>> origin/feature/crm-core-modules
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

<<<<<<< HEAD
    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash || '');
=======
    const isValid = validatePassword(user, password);
>>>>>>> origin/feature/crm-core-modules
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

<<<<<<< HEAD
    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash || '',
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    });

    // Set cookie
    const response = NextResponse.json({
=======
    // Create session
    const expires = new Date(Date.now() + (remember ? 30 : 8) * 60 * 60 * 1000);
    const session: Session = {
>>>>>>> origin/feature/crm-core-modules
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
<<<<<<< HEAD
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
=======
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
>>>>>>> origin/feature/crm-core-modules
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
