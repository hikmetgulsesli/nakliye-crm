import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/utils";

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        id: payload.sub,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
