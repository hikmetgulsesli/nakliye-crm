import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Validation schema for updating a customer
const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  postalCode: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  taxOffice: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT", "BLACKLISTED"]).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/customers/[id] - Get a single customer
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quotations: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
            totalCost: true,
            currency: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Müşteri bulunamadı" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Müşteri alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update a customer
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
    const validationResult = updateCustomerSchema.safeParse(body);
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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Müşteri bulunamadı" } },
        { status: 404 }
      );
    }

    // Check email uniqueness if email is being changed
    if (data.email && data.email !== existingCustomer.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: { email: data.email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "Bu e-posta adresiyle kayıtlı bir müşteri zaten var" } },
          { status: 409 }
        );
      }
    }

    // Build update data and track changes
    const updateData: Record<string, unknown> = {};
    const changedFields: Record<string, { old: unknown; new: unknown }> = {};

    const trackChange = (field: string, oldValue: unknown, newValue: unknown) => {
      if (oldValue !== newValue) {
        changedFields[field] = { old: oldValue, new: newValue };
        updateData[field] = newValue;
      }
    };

    // Process each field
    if (data.companyName !== undefined) trackChange("companyName", existingCustomer.companyName, data.companyName);
    if (data.contactName !== undefined) trackChange("contactName", existingCustomer.contactName, data.contactName);
    if (data.email !== undefined) trackChange("email", existingCustomer.email, data.email);
    if (data.phone !== undefined) trackChange("phone", existingCustomer.phone, data.phone);
    if (data.mobile !== undefined) trackChange("mobile", existingCustomer.mobile, data.mobile);
    if (data.address !== undefined) trackChange("address", existingCustomer.address, data.address);
    if (data.city !== undefined) trackChange("city", existingCustomer.city, data.city);
    if (data.country !== undefined) trackChange("country", existingCustomer.country, data.country);
    if (data.postalCode !== undefined) trackChange("postalCode", existingCustomer.postalCode, data.postalCode);
    if (data.taxNumber !== undefined) trackChange("taxNumber", existingCustomer.taxNumber, data.taxNumber);
    if (data.taxOffice !== undefined) trackChange("taxOffice", existingCustomer.taxOffice, data.taxOffice);
    if (data.status !== undefined) trackChange("status", existingCustomer.status, data.status);
    if (data.assignedToId !== undefined) trackChange("assignedToId", existingCustomer.assignedToId, data.assignedToId);
    if (data.notes !== undefined) trackChange("notes", existingCustomer.notes, data.notes);

    // If no changes, return early
    if (Object.keys(changedFields).length === 0) {
      return NextResponse.json({
        data: await prisma.customer.findUnique({
          where: { id },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
      });
    }

    // Update customer and create audit log in a transaction
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      // Update the customer
      const customer = await tx.customer.update({
        where: { id },
        data: updateData,
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
          action: "UPDATE",
          entityType: "customer",
          entityId: id,
          oldValues: changedFields as Prisma.InputJsonValue,
          newValues: updateData as Prisma.InputJsonValue,
        },
      });

      return customer;
    });

    return NextResponse.json({ data: updatedCustomer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Müşteri güncellenirken bir hata oluştu" } },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete a customer
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

    // Only admins can delete customers
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Bu işlem için admin yetkisi gereklidir" } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Müşteri bulunamadı" } },
        { status: 404 }
      );
    }

    // Delete customer and create audit log in a transaction
    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          entityType: "customer",
          entityId: id,
          oldValues: existingCustomer as unknown as Prisma.InputJsonValue,
        },
      });

      // Delete the customer
      await tx.customer.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Müşteri silinirken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
