import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Validation schema for updating a quotation
const updateQuotationSchema = z.object({
  originCity: z.string().min(1).optional(),
  originCountry: z.string().min(1).optional(),
  destinationCity: z.string().min(1).optional(),
  destinationCountry: z.string().min(1).optional(),
  transportMode: z.enum(["AIR", "SEA", "ROAD", "RAIL", "MULTIMODAL"]).optional(),
  incoterm: z.enum(["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]).optional().nullable(),
  cargoDescription: z.string().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  volumeM3: z.number().positive().optional().nullable(),
  packagesCount: z.number().int().positive().optional().nullable(),
  freightCost: z.number().positive().optional().nullable(),
  originCharges: z.number().positive().optional().nullable(),
  destinationCharges: z.number().positive().optional().nullable(),
  insuranceCost: z.number().positive().optional().nullable(),
  totalCost: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  estimatedTransitDays: z.number().int().positive().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PENDING", "WON", "LOST", "EXPIRED", "CANCELLED"]).optional(),
  lossReason: z.enum(["PRICE", "COMPETITOR", "DELAYED_RESPONSE", "NO_BUDGET", "OTHER"]).optional().nullable(),
});

// GET /api/quotations/[id] - Get a single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        revisions: {
          orderBy: { revisionNumber: "desc" },
          include: {
            revisedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Teklif bulunamadı" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Teklif alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations/[id] - Update a quotation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateQuotationSchema.safeParse(body);
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

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Teklif bulunamadı" } },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};

    // Helper to track changes
    const trackChange = (field: string, oldValue: unknown, newValue: unknown) => {
      if (oldValue !== newValue) {
        changedFields[field] = { old: oldValue, new: newValue };
        updateData[field] = newValue;
      }
    };

    // Process each field
    if (data.originCity !== undefined) trackChange("originCity", existingQuotation.originCity, data.originCity);
    if (data.originCountry !== undefined) trackChange("originCountry", existingQuotation.originCountry, data.originCountry);
    if (data.destinationCity !== undefined) trackChange("destinationCity", existingQuotation.destinationCity, data.destinationCity);
    if (data.destinationCountry !== undefined) trackChange("destinationCountry", existingQuotation.destinationCountry, data.destinationCountry);
    if (data.transportMode !== undefined) trackChange("transportMode", existingQuotation.transportMode, data.transportMode);
    if (data.incoterm !== undefined) trackChange("incoterm", existingQuotation.incoterm, data.incoterm);
    if (data.cargoDescription !== undefined) trackChange("cargoDescription", existingQuotation.cargoDescription, data.cargoDescription);
    if (data.weightKg !== undefined) trackChange("weightKg", existingQuotation.weightKg, data.weightKg);
    if (data.volumeM3 !== undefined) trackChange("volumeM3", existingQuotation.volumeM3, data.volumeM3);
    if (data.packagesCount !== undefined) trackChange("packagesCount", existingQuotation.packagesCount, data.packagesCount);
    if (data.freightCost !== undefined) trackChange("freightCost", existingQuotation.freightCost, data.freightCost);
    if (data.originCharges !== undefined) trackChange("originCharges", existingQuotation.originCharges, data.originCharges);
    if (data.destinationCharges !== undefined) trackChange("destinationCharges", existingQuotation.destinationCharges, data.destinationCharges);
    if (data.insuranceCost !== undefined) trackChange("insuranceCost", existingQuotation.insuranceCost, data.insuranceCost);
    if (data.totalCost !== undefined) trackChange("totalCost", existingQuotation.totalCost, data.totalCost);
    if (data.currency !== undefined) trackChange("currency", existingQuotation.currency, data.currency);
    if (data.validUntil !== undefined) {
      const oldDate = existingQuotation.validUntil?.toISOString() || null;
      const newDate = data.validUntil ? new Date(data.validUntil).toISOString() : null;
      trackChange("validUntil", oldDate, newDate);
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    }
    if (data.estimatedTransitDays !== undefined) trackChange("estimatedTransitDays", existingQuotation.estimatedTransitDays, data.estimatedTransitDays);
    if (data.internalNotes !== undefined) trackChange("internalNotes", existingQuotation.internalNotes, data.internalNotes);
    if (data.status !== undefined) trackChange("status", existingQuotation.status, data.status);
    if (data.lossReason !== undefined) trackChange("lossReason", existingQuotation.lossReason, data.lossReason);

    // If no changes, return early
    if (Object.keys(changedFields).length === 0) {
      return NextResponse.json({
        data: await prisma.quotation.findUnique({
          where: { id },
          include: {
            customer: { select: { id: true, companyName: true, contactName: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
      });
    }

    // Update quotation and create revision in a transaction
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Increment revision count
      const newRevisionCount = existingQuotation.revisionCount + 1;
      updateData.revisionCount = newRevisionCount;

      // Update the quotation
      const quotation = await tx.quotation.update({
        where: { id },
        data: updateData,
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

      // Create revision record
      await tx.quotationRevision.create({
        data: {
          quotationId: id,
          revisionNumber: newRevisionCount,
          changedFields: changedFields as Prisma.InputJsonValue,
          revisedById: session.user.id,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entityType: "quotation",
          entityId: id,
          oldValues: changedFields as Prisma.InputJsonValue,
          newValues: updateData as Prisma.InputJsonValue,
        },
      });

      return quotation;
    });

    return NextResponse.json({ data: updatedQuotation });
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Teklif güncellenirken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// DELETE /api/quotations/[id] - Delete a quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" } },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Teklif bulunamadı" } },
        { status: 404 }
      );
    }

    // Delete quotation and create audit log in a transaction
    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          entityType: "quotation",
          entityId: id,
          oldValues: existingQuotation as unknown as Prisma.InputJsonValue,
        },
      });

      // Delete the quotation (revisions will be cascade deleted)
      await tx.quotation.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Teklif silinirken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
