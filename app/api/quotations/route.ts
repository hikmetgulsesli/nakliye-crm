import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateQuoteNumber } from "@/lib/quote-number";

// Validation schema for creating a quotation
const createQuotationSchema = z.object({
  customerId: z.string().uuid("Geçerli bir müşteri ID'si giriniz"),
  originCity: z.string().min(1, "Çıkış şehri zorunludur"),
  originCountry: z.string().min(1, "Çıkış ülkesi zorunludur"),
  destinationCity: z.string().min(1, "Varış şehri zorunludur"),
  destinationCountry: z.string().min(1, "Varış ülkesi zorunludur"),
  transportMode: z.enum(["AIR", "SEA", "ROAD", "RAIL", "MULTIMODAL"]),
  incoterm: z.enum(["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]).optional(),
  cargoDescription: z.string().optional(),
  weightKg: z.number().positive().optional(),
  volumeM3: z.number().positive().optional(),
  packagesCount: z.number().int().positive().optional(),
  freightCost: z.number().positive().optional(),
  originCharges: z.number().positive().optional(),
  destinationCharges: z.number().positive().optional(),
  insuranceCost: z.number().positive().optional(),
  totalCost: z.number().positive().optional(),
  currency: z.string().default("USD"),
  validUntil: z.string().datetime().optional(),
  estimatedTransitDays: z.number().int().positive().optional(),
  internalNotes: z.string().optional(),
});

// GET /api/quotations - List quotations with filters
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
    const customerId = searchParams.get("customerId");
    const createdById = searchParams.get("createdById");
    const transportMode = searchParams.get("transportMode");
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

    if (customerId) {
      where.customerId = customerId;
    }

    if (createdById) {
      where.createdById = createdById;
    }

    if (transportMode) {
      where.transportMode = transportMode;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
        { originCity: { contains: search, mode: "insensitive" } },
        { destinationCity: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.quotation.count({ where });

    // Get quotations with pagination
    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: quotations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Teklifler alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// POST /api/quotations - Create a new quotation
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
    const validationResult = createQuotationSchema.safeParse(body);
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

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Müşteri bulunamadı" } },
        { status: 404 }
      );
    }

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quotation and update customer lastQuoteDate in a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      // Create the quotation
      const newQuotation = await tx.quotation.create({
        data: {
          quoteNumber,
          customerId: data.customerId,
          createdById: session.user.id,
          originCity: data.originCity,
          originCountry: data.originCountry,
          destinationCity: data.destinationCity,
          destinationCountry: data.destinationCountry,
          transportMode: data.transportMode,
          incoterm: data.incoterm,
          cargoDescription: data.cargoDescription,
          weightKg: data.weightKg ? String(data.weightKg) : null,
          volumeM3: data.volumeM3 ? String(data.volumeM3) : null,
          packagesCount: data.packagesCount,
          freightCost: data.freightCost ? String(data.freightCost) : null,
          originCharges: data.originCharges ? String(data.originCharges) : null,
          destinationCharges: data.destinationCharges ? String(data.destinationCharges) : null,
          insuranceCost: data.insuranceCost ? String(data.insuranceCost) : null,
          totalCost: data.totalCost ? String(data.totalCost) : null,
          currency: data.currency,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          estimatedTransitDays: data.estimatedTransitDays,
          internalNotes: data.internalNotes,
          status: "DRAFT",
          revisionCount: 0,
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update customer's lastQuoteDate
      await tx.customer.update({
        where: { id: data.customerId },
        data: { lastQuoteDate: new Date() },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entityType: "quotation",
          entityId: newQuotation.id,
          newValues: newQuotation as unknown as Prisma.InputJsonValue,
        },
      });

      return newQuotation;
    });

    return NextResponse.json({ data: quotation }, { status: 201 });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Teklif oluşturulurken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
