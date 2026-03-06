<<<<<<< HEAD
import { NextResponse } from "next/server";

// POST /api/auth/logout - Logout user
export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

// GET /api/auth/logout - Also handle GET for convenience
export async function GET() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
=======
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ success: true });
>>>>>>> origin/feature/crm-core-modules
}
