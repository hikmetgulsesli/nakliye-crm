import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma.js";
import { authOptions } from "@/lib/auth.js";

// GET /api/quotations/[id]/revisions - Get revision history for a quotation
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

    // Check if quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, quoteNumber: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Teklif bulunamadı" } },
        { status: 404 }
      );
    }

    // Get revisions with user info
    const revisions = await prisma.quotationRevision.findMany({
      where: { quotationId: id },
      include: {
        revisedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { revisionNumber: "desc" },
    });

    return NextResponse.json({
      data: {
        quotationId: id,
        quoteNumber: quotation.quoteNumber,
        revisions,
      },
    });
  } catch (error) {
    console.error("Error fetching quotation revisions:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Revizyon geçmişi alınırken bir hata oluştu" } },
      { status: 500 }
    );
  }
}
