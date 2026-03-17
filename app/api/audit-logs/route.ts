import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Query parameters validation schema
const querySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "TRANSFER", "LOGIN", "LOGOUT"]).optional(),
  entityType: z.enum(["customer", "quotation", "activity", "user", "lookup_value"]).optional(),
  entityId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default(() => 1),
  limit: z.string().transform(Number).default(() => 20),
  sortBy: z.enum(["createdAt", "action", "entityType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Helper function to check if user is admin
async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

// GET /api/audit-logs - List audit logs with filters (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Bu işlem için admin yetkisi gereklidir" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const validatedParams = querySchema.safeParse({
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    });

    if (!validatedParams.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz sorgu parametreleri",
            details: validatedParams.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const params = validatedParams.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.entityId) {
      where.entityId = params.entityId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(params.startDate);
      }
      if (params.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(params.endDate);
      }
    }

    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: "insensitive" } },
        { entityType: { contains: params.search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: params.search, mode: "insensitive" } },
              { lastName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get audit logs with pagination
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { [params.sortBy]: params.sortOrder },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    return NextResponse.json({
      data: auditLogs,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Denetim kayıtları alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
