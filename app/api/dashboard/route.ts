import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserDashboardData, getAdminDashboardData } from "@/lib/dashboard";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    if (isAdmin) {
      const data = await getAdminDashboardData();
      return NextResponse.json({ ...data, isAdmin: true });
    } else {
      const data = await getUserDashboardData(session.user.id as string);
      return NextResponse.json({ ...data, isAdmin: false });
    }
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
