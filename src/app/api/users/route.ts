import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getUsers, createUser } from '@/lib/db/users';
import { hashPassword } from '@/lib/auth/users';
import { createUserSchema } from '@/lib/validation';
import { verifyToken } from '@/lib/auth/utils';

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin role
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const users = await getUsers({ page, limit });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin role
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate body
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

=======
import { getAllUsers, createUser } from '@/lib/db/users';
import { requireAdmin } from '@/lib/auth/session';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  role: z.enum(['admin', 'user']),
});

export async function GET() {
  try {
    await requireAdmin();
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    
    const result = createUserSchema.safeParse(body);
>>>>>>> origin/feature/crm-core-modules
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Hash password
    const password_hash = await hashPassword(result.data.password);

    // Create user
    const user = await createUser({
      ...result.data,
      password_hash,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
=======
    const user = createUser(result.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
>>>>>>> origin/feature/crm-core-modules
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
<<<<<<< HEAD

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
=======
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
>>>>>>> origin/feature/crm-core-modules
  }
}
