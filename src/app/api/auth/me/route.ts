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
  }
}
