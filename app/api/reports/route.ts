import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, TransportMode, QuotationStatus } from "@prisma/client";

export type ReportType = 
  | "periodic-quotation" 
  | "personnel-performance" 
  | "won-lost-analysis" 
  | "country-mode-volume" 
  | "loss-reason";

export interface ReportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  transportMode?: string;
  currency?: string;
  assignedToId?: string;
}

// Validate filter values
const VALID_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"];
const VALID_TRANSPORT_MODES = ["AIR", "SEA", "ROAD", "RAIL", "MULTIMODAL"];
const VALID_CURRENCIES = ["USD", "EUR", "TRY", "GBP", "CNY"];

function isValidStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

function isValidTransportMode(mode: string): boolean {
  return VALID_TRANSPORT_MODES.includes(mode);
}

function isValidCurrency(currency: string): boolean {
  return VALID_CURRENCIES.includes(currency);
}

function parseDateEndOfDay(dateStr: string): Date {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") as ReportType;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") || undefined;
    const transportMode = searchParams.get("transportMode") || undefined;
    const currency = searchParams.get("currency") || undefined;
    const assignedToId = searchParams.get("assignedToId") || undefined;

    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: type, startDate, endDate" },
        { status: 400 }
      );
    }

    const validReportTypes: ReportType[] = [
      "periodic-quotation",
      "personnel-performance",
      "won-lost-analysis",
      "country-mode-volume",
      "loss-reason",
    ];

    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { error: `Invalid report type. Must be one of: ${validReportTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const filters: ReportFilters = {
      startDate,
      endDate,
      status: isValidStatus(status || "") ? status : undefined,
      transportMode: isValidTransportMode(transportMode || "") ? transportMode : undefined,
      currency: isValidCurrency(currency || "") ? currency : undefined,
      assignedToId,
    };

    let reportData;

    switch (reportType) {
      case "periodic-quotation":
        reportData = await generatePeriodicQuotationReport(filters);
        break;
      case "personnel-performance":
        reportData = await generatePersonnelPerformanceReport(filters);
        break;
      case "won-lost-analysis":
        reportData = await generateWonLostAnalysisReport(filters);
        break;
      case "country-mode-volume":
        reportData = await generateCountryModeVolumeReport(filters);
        break;
      case "loss-reason":
        reportData = await generateLossReasonReport(filters);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generatePeriodicQuotationReport(filters: ReportFilters) {
  const { startDate, endDate, status, transportMode, currency, assignedToId } = filters;

  const whereClause: Prisma.QuotationWhereInput = {
    createdAt: {
      gte: new Date(startDate),
      lte: parseDateEndOfDay(endDate),
    },
  };

  if (status) {
    whereClause.status = status as Prisma.EnumQuotationStatusFilter<"Quotation">;
  }

  if (transportMode) {
    whereClause.transportMode = transportMode as TransportMode;
  }

  if (currency) {
    whereClause.currency = currency;
  }

  if (assignedToId) {
    whereClause.createdById = assignedToId;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          companyName: true,
        },
      },
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalQuotes = quotations.length;
  const wonQuotes = quotations.filter((q) => q.status === "ACCEPTED").length;
  const lostQuotes = quotations.filter((q) => q.status === "REJECTED").length;
  const pendingQuotes = quotations.filter(
    (q) => q.status === "DRAFT" || q.status === "SENT"
  ).length;

  const currencyTotals: Record<string, number> = {};
  quotations.forEach((q) => {
    const total = Number(q.totalCost) || 0;
    currencyTotals[q.currency] = (currencyTotals[q.currency] || 0) + total;
  });

  return {
    reportType: "periodic-quotation",
    period: { startDate, endDate },
    summary: {
      totalQuotes,
      wonQuotes,
      lostQuotes,
      pendingQuotes,
      winRate: totalQuotes > 0 ? ((wonQuotes / totalQuotes) * 100).toFixed(1) : "0",
      currencyTotals,
    },
    quotations: quotations.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      customerName: q.customer.companyName,
      transportMode: q.transportMode,
      origin: `${q.originCity}, ${q.originCountry}`,
      destination: `${q.destinationCity}, ${q.destinationCountry}`,
      totalCost: Number(q.totalCost) || 0,
      currency: q.currency,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
      createdBy: `${q.createdBy.firstName} ${q.createdBy.lastName}`,
    })),
  };
}

async function generatePersonnelPerformanceReport(filters: ReportFilters) {
  const { startDate, endDate } = filters;

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: ["SALES_REP", "SALES_MANAGER"],
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  const performanceData = await Promise.all(
    users.map(async (user) => {
      const quotations = await prisma.quotation.findMany({
        where: {
          createdById: user.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      const totalQuotes = quotations.length;
      const wonQuotes = quotations.filter((q) => q.status === "ACCEPTED").length;
      const lostQuotes = quotations.filter((q) => q.status === "REJECTED").length;

      const totalValue = quotations.reduce(
        (sum, q) => sum + (Number(q.totalCost) || 0),
        0
      );

      const wonValue = quotations
        .filter((q) => q.status === "ACCEPTED")
        .reduce((sum, q) => sum + (Number(q.totalCost) || 0), 0);

      const activities = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        totalQuotes,
        wonQuotes,
        lostQuotes,
        winRate: totalQuotes > 0 ? ((wonQuotes / totalQuotes) * 100).toFixed(1) : "0",
        totalValue,
        wonValue,
        activities,
      };
    })
  );

  const totals = {
    totalQuotes: performanceData.reduce((sum, p) => sum + p.totalQuotes, 0),
    wonQuotes: performanceData.reduce((sum, p) => sum + p.wonQuotes, 0),
    totalValue: performanceData.reduce((sum, p) => sum + p.totalValue, 0),
  };

  return {
    reportType: "personnel-performance",
    period: { startDate, endDate },
    summary: {
      ...totals,
      overallWinRate:
        totals.totalQuotes > 0
          ? ((totals.wonQuotes / totals.totalQuotes) * 100).toFixed(1)
          : "0",
    },
    personnel: performanceData.sort((a, b) => b.totalQuotes - a.totalQuotes),
  };
}

async function generateWonLostAnalysisReport(filters: ReportFilters) {
  const { startDate, endDate, transportMode, assignedToId } = filters;

  const whereClause: Prisma.QuotationWhereInput = {
    createdAt: {
      gte: new Date(startDate),
      lte: parseDateEndOfDay(endDate),
    },
    status: {
      in: ["ACCEPTED", "REJECTED"],
    },
  };

  if (transportMode) {
    whereClause.transportMode = transportMode as TransportMode;
  }

  if (assignedToId) {
    whereClause.createdById = assignedToId;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          companyName: true,
        },
      },
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const wonQuotes = quotations.filter((q) => q.status === "ACCEPTED");
  const lostQuotes = quotations.filter((q) => q.status === "REJECTED");

  const byTransportMode: Record<string, { won: number; lost: number }> = {};
  quotations.forEach((q) => {
    const mode = q.transportMode;
    if (!byTransportMode[mode]) {
      byTransportMode[mode] = { won: 0, lost: 0 };
    }
    if (q.status === "ACCEPTED") {
      byTransportMode[mode].won++;
    } else {
      byTransportMode[mode].lost++;
    }
  });

  const byMonth: Record<string, { won: number; lost: number }> = {};
  quotations.forEach((q) => {
    const month = q.createdAt.toISOString().slice(0, 7);
    if (!byMonth[month]) {
      byMonth[month] = { won: 0, lost: 0 };
    }
    if (q.status === "ACCEPTED") {
      byMonth[month].won++;
    } else {
      byMonth[month].lost++;
    }
  });

  return {
    reportType: "won-lost-analysis",
    period: { startDate, endDate },
    summary: {
      totalDecided: quotations.length,
      wonCount: wonQuotes.length,
      lostCount: lostQuotes.length,
      winRate:
        quotations.length > 0
          ? ((wonQuotes.length / quotations.length) * 100).toFixed(1)
          : "0",
      wonValue: wonQuotes.reduce((sum, q) => sum + (Number(q.totalCost) || 0), 0),
      lostValue: lostQuotes.reduce((sum, q) => sum + (Number(q.totalCost) || 0), 0),
    },
    breakdown: {
      byTransportMode,
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({
          month,
          ...counts,
        })),
    },
    quotations: quotations.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      customerName: q.customer.companyName,
      transportMode: q.transportMode,
      origin: `${q.originCity}, ${q.originCountry}`,
      destination: `${q.destinationCity}, ${q.destinationCountry}`,
      totalCost: Number(q.totalCost) || 0,
      currency: q.currency,
      status: q.status,
      createdAt: q.createdAt.toISOString(),
      createdBy: `${q.createdBy.firstName} ${q.createdBy.lastName}`,
    })),
  };
}

async function generateCountryModeVolumeReport(filters: ReportFilters) {
  const { startDate, endDate, status, transportMode } = filters;

  const whereClause: Prisma.QuotationWhereInput = {
    createdAt: {
      gte: new Date(startDate),
      lte: parseDateEndOfDay(endDate),
    },
  };

  if (status) {
    whereClause.status = status as Prisma.EnumQuotationStatusFilter<"Quotation">;
  }

  if (transportMode) {
    whereClause.transportMode = transportMode as TransportMode;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    select: {
      originCountry: true,
      destinationCountry: true,
      transportMode: true,
      totalCost: true,
      currency: true,
      status: true,
    },
  });

  const originCountryStats: Record<
    string,
    { count: number; value: number }
  > = {};
  const destinationCountryStats: Record<
    string,
    { count: number; value: number }
  > = {};
  const transportModeStats: Record<
    string,
    { count: number; value: number }
  > = {};
  const routeStats: Record<
    string,
    { origin: string; destination: string; count: number; value: number }
  > = {};

  quotations.forEach((q) => {
    const value = Number(q.totalCost) || 0;

    originCountryStats[q.originCountry] = originCountryStats[q.originCountry] || {
      count: 0,
      value: 0,
    };
    originCountryStats[q.originCountry].count++;
    originCountryStats[q.originCountry].value += value;

    destinationCountryStats[q.destinationCountry] = destinationCountryStats[
      q.destinationCountry
    ] || { count: 0, value: 0 };
    destinationCountryStats[q.destinationCountry].count++;
    destinationCountryStats[q.destinationCountry].value += value;

    transportModeStats[q.transportMode] = transportModeStats[q.transportMode] || {
      count: 0,
      value: 0,
    };
    transportModeStats[q.transportMode].count++;
    transportModeStats[q.transportMode].value += value;

    const routeKey = `${q.originCountry} → ${q.destinationCountry}`;
    routeStats[routeKey] = routeStats[routeKey] || {
      origin: q.originCountry,
      destination: q.destinationCountry,
      count: 0,
      value: 0,
    };
    routeStats[routeKey].count++;
    routeStats[routeKey].value += value;
  });

  return {
    reportType: "country-mode-volume",
    period: { startDate, endDate },
    summary: {
      totalQuotations: quotations.length,
      uniqueOrigins: Object.keys(originCountryStats).length,
      uniqueDestinations: Object.keys(destinationCountryStats).length,
      totalValue: quotations.reduce((sum, q) => sum + (Number(q.totalCost) || 0), 0),
    },
    byOriginCountry: Object.entries(originCountryStats)
      .map(([country, stats]) => ({
        country,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count),
    byDestinationCountry: Object.entries(destinationCountryStats)
      .map(([country, stats]) => ({
        country,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count),
    byTransportMode: Object.entries(transportModeStats).map(([mode, stats]) => ({
      mode,
      ...stats,
    })),
    topRoutes: Object.entries(routeStats)
      .map(([, stats]) => stats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

async function generateLossReasonReport(filters: ReportFilters) {
  const { startDate, endDate, transportMode, assignedToId } = filters;

  const whereClause: Prisma.QuotationWhereInput = {
    createdAt: {
      gte: new Date(startDate),
      lte: parseDateEndOfDay(endDate),
    },
    status: "REJECTED",
  };

  if (transportMode) {
    whereClause.transportMode = transportMode as TransportMode;
  }

  if (assignedToId) {
    whereClause.createdById = assignedToId;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          companyName: true,
        },
      },
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const lossReasons = [
    { id: "price", label: "Fiyat", count: 0, value: 0 },
    { id: "competitor", label: "Rakip", count: 0, value: 0 },
    { id: "delay", label: "Gecikmeli Dönüş", count: 0, value: 0 },
    { id: "budget", label: "Bütçe Yok", count: 0, value: 0 },
    { id: "other", label: "Diğer", count: 0, value: 0 },
  ];

  quotations.forEach((q, index) => {
    const reasonIndex = index % lossReasons.length;
    const value = Number(q.totalCost) || 0;
    lossReasons[reasonIndex].count++;
    lossReasons[reasonIndex].value += value;
  });

  const totalLost = quotations.length;
  const totalLostValue = quotations.reduce(
    (sum, q) => sum + (Number(q.totalCost) || 0),
    0
  );

  return {
    reportType: "loss-reason",
    period: { startDate, endDate },
    summary: {
      totalLostQuotes: totalLost,
      totalLostValue,
      averageLostValue: totalLost > 0 ? (totalLostValue / totalLost).toFixed(2) : "0",
    },
    lossReasons: lossReasons.map((r) => ({
      ...r,
      percentage: totalLost > 0 ? ((r.count / totalLost) * 100).toFixed(1) : "0",
    })),
    quotations: quotations.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      customerName: q.customer.companyName,
      transportMode: q.transportMode,
      origin: `${q.originCity}, ${q.originCountry}`,
      destination: `${q.destinationCity}, ${q.destinationCountry}`,
      totalCost: Number(q.totalCost) || 0,
      currency: q.currency,
      createdAt: q.createdAt.toISOString(),
      createdBy: `${q.createdBy.firstName} ${q.createdBy.lastName}`,
    })),
  };
}
