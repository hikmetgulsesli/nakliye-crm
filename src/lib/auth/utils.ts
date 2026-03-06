<<<<<<< HEAD
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { User } from '@/types';

=======
import { jwtVerify, SignJWT } from "jose";

<<<<<<< HEAD
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
=======
>>>>>>> origin/feature/crm-core-modules
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
<<<<<<< HEAD
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
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)
}

export interface TokenPayload {
  sub: string;
  email: string;
  full_name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
>>>>>>> origin/feature/crm-core-modules
  } catch {
    return null;
  }
}

<<<<<<< HEAD
// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === 'admin';
=======
export async function createToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());

  return token;
>>>>>>> origin/feature/crm-core-modules
}
