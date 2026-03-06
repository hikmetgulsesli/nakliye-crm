import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { User } from '@/types';

const JWT_SECRET_VALUE = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export async function createToken(user: User): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8 hours')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{
  sub: string;
  email: string;
  role: string;
  full_name: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      sub: string;
      email: string;
      role: string;
      full_name: string;
    };
  } catch {
    return null;
  }
}

// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === 'admin';
}
