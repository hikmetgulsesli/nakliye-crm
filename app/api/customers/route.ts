import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Validation schema for creating a customer
const createCustomerSchema = z.object({
  companyName: z.string().min(1, "Firma adı zorunludur"),
  contactName: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Türkiye"),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT", "BLACKLISTED"]).default("PROSPECT"),
  assignedToId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// GET /api/customers - List customers with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Müşteriler alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Geçersiz giriş",
            details: validationResult.error.issues.map((err) => ({
              field: String(err.path.join(".")),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for duplicate email
    const existingEmail = await prisma.customer.findFirst({
      where: { email: data.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Bu e-posta adresiyle kayıtlı bir müşteri zaten var" } },
        { status: 409 }
      );
    }

    // Create customer and audit log in a transaction
    const customer = await prisma.$transaction(async (tx) => {
      // Create the customer
      const newCustomer = await tx.customer.create({
        data: {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          mobile: data.mobile,
          address: data.address,
          city: data.city,
          country: data.country,
          postalCode: data.postalCode,
          taxNumber: data.taxNumber,
          taxOffice: data.taxOffice,
          status: data.status,
          assignedToId: data.assignedToId || session.user.id,
          notes: data.notes,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entityType: "customer",
          entityId: newCustomer.id,
          newValues: newCustomer as unknown as Prisma.InputJsonValue,
        },
      });

      return newCustomer;
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Müşteri oluşturulurken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
