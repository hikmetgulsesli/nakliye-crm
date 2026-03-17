import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    // Get date ranges for calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate user-specific metrics
    const userMetrics = await calculateUserMetrics(userId, {
      today,
      weekStart,
      weekEnd,
      monthStart,
      monthEnd,
    });

    // Calculate user widgets data
    const userWidgets = await calculateUserWidgets(userId, {
      today,
      fourteenDaysAgo,
      sevenDaysAgo,
    });

    // Prepare response
    const response: Record<string, unknown> = {
      user: userMetrics,
      widgets: userWidgets,
    };

    // Add admin metrics if user is admin
    if (isAdmin) {
      const adminMetrics = await calculateAdminMetrics({
        today,
        weekStart,
        weekEnd,
        monthStart,
        monthEnd,
        lastMonthStart,
        lastMonthEnd,
        thirtyDaysAgo,
      });
      response.admin = adminMetrics;
    }

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch dashboard data",
        },
      },
      { status: 500 }
    );
  }
}

async function calculateUserMetrics(
  userId: string,
  dates: {
    today: Date;
    weekStart: Date;
    weekEnd: Date;
    monthStart: Date;
    monthEnd: Date;
  }
) {
  const { today, weekStart, weekEnd, monthStart, monthEnd } = dates;

  // This week's quotations
  const weeklyQuotes = await prisma.quotation.count({
    where: {
      createdById: userId,
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  // This month's quotations
  const monthlyQuotes = await prisma.quotation.count({
    where: {
      createdById: userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // This month's won quotations
  const monthlyWon = await prisma.quotation.count({
    where: {
      createdById: userId,
      status: "ACCEPTED",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // Monthly win rate
  const monthlyWinRate = monthlyQuotes > 0 ? Math.round((monthlyWon / monthlyQuotes) * 100) : 0;

  // Customers contacted this month (via activities)
  const contactedCustomers = await prisma.activity.count({
    where: {
      userId: userId,
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
      customerId: { not: null },
    },
  });

  return {
    weeklyQuotes,
    monthlyQuotes,
    monthlyWon,
    monthlyWinRate,
    contactedCustomers,
  };
}

async function calculateUserWidgets(
  userId: string,
  dates: {
    today: Date;
    fourteenDaysAgo: Date;
    sevenDaysAgo: Date;
  }
) {
  const { today, fourteenDaysAgo, sevenDaysAgo } = dates;
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Upcoming follow-ups (next 3 days)
  const upcomingFollowUps = await prisma.activity.findMany({
    where: {
      userId: userId,
      dueDate: {
        gte: today,
        lte: threeDaysFromNow,
      },
      completedAt: null,
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  // Customers not contacted in 14+ days
  const customersToCall = await prisma.customer.findMany({
    where: {
      assignedToId: userId,
      OR: [
        {
          activities: {
            every: {
              createdAt: {
                lt: fourteenDaysAgo,
              },
            },
          },
        },
        {
          activities: {
            none: {},
          },
        },
      ],
    },
    select: {
      id: true,
      companyName: true,
      _count: {
        select: {
          activities: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 5,
  });

  // Pending quotes (no update in 7+ days, still in DRAFT or SENT status)
  const pendingQuotes = await prisma.quotation.findMany({
    where: {
      createdById: userId,
      status: {
        in: ["DRAFT", "SENT"],
      },
      updatedAt: {
        lte: sevenDaysAgo,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "asc",
    },
    take: 5,
  });

  // Recent activities (last 10)
  const recentActivities = await prisma.activity.findMany({
    where: {
      OR: [
        { userId: userId },
        { customer: { assignedToId: userId } },
      ],
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return {
    upcomingFollowUps: upcomingFollowUps.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      dueDate: a.dueDate?.toISOString() ?? null,
      customer: a.customer,
    })),
    customersToCall: customersToCall.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      totalActivities: c._count.activities,
    })),
    pendingQuotes: pendingQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      updatedAt: q.updatedAt.toISOString(),
      customer: q.customer,
    })),
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
      customer: a.customer,
      userName: `${a.user.firstName} ${a.user.lastName}`,
    })),
  };
}

async function calculateAdminMetrics(dates: {
  today: Date;
  weekStart: Date;
  weekEnd: Date;
  monthStart: Date;
  monthEnd: Date;
  lastMonthStart: Date;
  lastMonthEnd: Date;
  thirtyDaysAgo: Date;
}) {
  const { weekStart, weekEnd, monthStart, monthEnd, lastMonthStart, lastMonthEnd, thirtyDaysAgo } = dates;

  // Team metrics
  const weeklyQuotesTotal = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
  });

  const monthlyQuotesTotal = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const lastMonthQuotesTotal = await prisma.quotation.count({
    where: {
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });

  const monthlyWonTotal = await prisma.quotation.count({
    where: {
      status: "ACCEPTED",
      createdAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const teamWinRate = monthlyQuotesTotal > 0 ? Math.round((monthlyWonTotal / monthlyQuotesTotal) * 100) : 0;

  const activeCustomers = await prisma.customer.count({
    where: {
      status: "ACTIVE",
    },
  });

  const highPotentialCustomers = await prisma.customer.count({
    where: {
      status: "PROSPECT",
    },
  });

  // Personnel performance
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["SALES_REP", "SALES_MANAGER", "ADMIN"] },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  const personnelPerformance = await Promise.all(
    users.map(async (user) => {
      const quoteCount = await prisma.quotation.count({
        where: {
          createdById: user.id,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const wonCount = await prisma.quotation.count({
        where: {
          createdById: user.id,
          status: "ACCEPTED",
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const winRate = quoteCount > 0 ? Math.round((wonCount / quoteCount) * 100) : 0;

      const contactedCount = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          customerId: { not: null },
        },
      });

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        quoteCount,
        wonCount,
        winRate,
        contactedCount,
      };
    })
  );

  // Sort by quote count descending
  personnelPerformance.sort((a, b) => b.quoteCount - a.quoteCount);

  // Country distribution (origin countries)
  const originCountryDistribution = await prisma.quotation.groupBy({
    by: ["originCountry"],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // Destination country distribution
  const destinationCountryDistribution = await prisma.quotation.groupBy({
    by: ["destinationCountry"],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 10,
  });

  // Transport mode distribution
  const transportModeDistribution = await prisma.quotation.groupBy({
    by: ["transportMode"],
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
    _count: {
      id: true,
    },
  });

  // Transport mode with win rates
  const transportModeStats = await Promise.all(
    transportModeDistribution.map(async (mode) => {
      const wonCount = await prisma.quotation.count({
        where: {
          transportMode: mode.transportMode,
          status: "ACCEPTED",
          createdAt: {
            gte: monthStart,
          },
        },
      });

      return {
        mode: mode.transportMode,
        quoteCount: mode._count.id,
        wonCount,
        winRate: mode._count.id > 0 ? Math.round((wonCount / mode._count.id) * 100) : 0,
      };
    })
  );

  // Loss reason analysis (using activities where quote was rejected)
  const rejectedQuotes = await prisma.quotation.findMany({
    where: {
      status: "REJECTED",
      createdAt: {
        gte: monthStart,
      },
    },
    include: {
      activities: {
        where: {
          type: "QUOTE_REJECTED",
        },
        select: {
          description: true,
        },
      },
    },
  });

  // Aggregate loss reasons from activity descriptions
  const lossReasons: Record<string, number> = {};
  rejectedQuotes.forEach((quote) => {
    const reason = quote.activities[0]?.description || "Unknown";
    lossReasons[reason] = (lossReasons[reason] || 0) + 1;
  });

  // Convert to array and sort
  const lossReasonAnalysis = Object.entries(lossReasons)
    .map(([reason, count]) => ({
      reason,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    teamMetrics: {
      weeklyQuotes: weeklyQuotesTotal,
      monthlyQuotes: monthlyQuotesTotal,
      lastMonthQuotes: lastMonthQuotesTotal,
      monthlyWon: monthlyWonTotal,
      teamWinRate,
      activeCustomers,
      highPotentialCustomers,
    },
    personnelPerformance,
    originCountries: originCountryDistribution.map((c) => ({
      country: c.originCountry,
      quoteCount: c._count.id,
    })),
    destinationCountries: destinationCountryDistribution.map((c) => ({
      country: c.destinationCountry,
      quoteCount: c._count.id,
    })),
    transportModeStats,
    lossReasonAnalysis,
  };
}
