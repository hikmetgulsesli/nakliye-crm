<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/utils';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
=======
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return the full user data from the session
    return NextResponse.json({
      data: session.user,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
>>>>>>> origin/feature/crm-core-modules
  }
}
