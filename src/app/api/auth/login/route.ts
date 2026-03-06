import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db/users';
import { verifyPassword, createToken } from '@/lib/auth/utils';
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
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user with password
    const pool = getPool();
    const userResult = await pool.query(
      `SELECT id, email, full_name, role, is_active, password_hash 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token - pass full user object with required fields
    const token = await createToken({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
      updated_at: user.updated_at ? user.updated_at.toISOString() : new Date().toISOString(),
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
