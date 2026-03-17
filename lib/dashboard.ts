import { prisma } from "@/lib/prisma";
import { QuotationStatus, ActivityType } from "@prisma/client";

export interface UserDashboardMetrics {
  quotesThisWeek: number;
  quotesThisMonth: number;
  quotesWonThisMonth: number;
  winRateThisMonth: number;
  customersContactedThisMonth: number;
}

export interface UpcomingFollowUp {
  id: string;
  subject: string;
  description: string | null;
  dueDate: Date;
  customerName: string;
  customerId: string;
}

export interface CustomerToCall {
  id: string;
  companyName: string;
  lastContactDate: Date | null;
  daysSinceContact: number;
}

export interface PendingQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerId: string;
  createdAt: Date;
  daysPending: number;
  totalCost: number | null;
  currency: string;
}

export interface RecentActivity {
  id: string;
  type: ActivityType;
  subject: string | null;
  description: string | null;
  createdAt: Date;
  userName: string;
  customerName: string | null;
}

export interface UserDashboardData {
  metrics: UserDashboardMetrics;
  upcomingFollowUps: UpcomingFollowUp[];
  customersToCall: CustomerToCall[];
  pendingQuotes: PendingQuote[];
  recentActivities: RecentActivity[];
}

export interface PersonnelPerformance {
  id: string;
  name: string;
  quotesGiven: number;
  quotesWon: number;
  winRate: number;
  customersContacted: number;
}

export interface CountryStats {
  country: string;
  quoteCount: number;
}

export interface ModeStats {
  mode: string;
  quoteCount: number;
  winRate: number;
}

export interface LossReasonStats {
  reason: string;
  count: number;
  rate: number;
}

export interface AdminDashboardMetrics {
  quotesGivenThisWeek: number;
  quotesGivenThisMonth: number;
  quotesGivenLastMonth: number;
  quotesWonThisWeek: number;
  quotesWonThisMonth: number;
  quotesWonLastMonth: number;
  winRateThisMonth: number;
  activeCustomerCount: number;
  highPotentialCustomerCount: number;
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetrics;
  personnelPerformance: PersonnelPerformance[];
  topOriginCountries: CountryStats[];
  topDestinationCountries: CountryStats[];
  modeDistribution: ModeStats[];
  lossReasonAnalysis: LossReasonStats[];
}

// Helper to get date ranges
function getDateRanges() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  return {
    now,
    startOfWeek,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth,
    fourteenDaysAgo,
    sevenDaysAgo,
    threeDaysFromNow,
  };
}

export async function getUserDashboardData(userId: string): Promise<UserDashboardData> {
  const ranges = getDateRanges();

  // Get metrics
  const [
    quotesThisWeek,
    quotesThisMonth,
    quotesWonThisMonth,
    customersContactedThisMonth,
  ] = await Promise.all([
    // Quotes this week
    prisma.quotation.count({
      where: {
        createdById: userId,
        createdAt: { gte: ranges.startOfWeek },
      },
    }),
    // Quotes this month
    prisma.quotation.count({
      where: {
        createdById: userId,
        createdAt: { gte: ranges.startOfMonth },
      },
    }),
    // Quotes won this month
    prisma.quotation.count({
      where: {
        createdById: userId,
        status: QuotationStatus.ACCEPTED,
        createdAt: { gte: ranges.startOfMonth },
      },
    }),
    // Customers contacted this month
    prisma.activity.count({
      where: {
        userId,
        customerId: { not: null },
        createdAt: { gte: ranges.startOfMonth },
      },
    }),
  ]);

  const winRateThisMonth = quotesThisMonth > 0 
    ? Math.round((quotesWonThisMonth / quotesThisMonth) * 100) 
    : 0;

  // Get upcoming follow-ups (today + next 3 days)
  const upcomingFollowUps = await prisma.activity.findMany({
    where: {
      userId,
      dueDate: {
        gte: new Date(),
        lte: ranges.threeDaysFromNow,
      },
      completedAt: null,
    },
    include: {
      customer: {
        select: { id: true, companyName: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  // Get customers to call (no contact for 14+ days, assigned to user)
  const customersWithRecentActivity = await prisma.activity.groupBy({
    by: ["customerId"],
    where: {
      customerId: { not: null },
      createdAt: { gte: ranges.fourteenDaysAgo },
    },
    _max: { createdAt: true },
  });

  const activeCustomerIds = new Set(
    customersWithRecentActivity.map((a) => a.customerId)
  );

  const customersToCallRaw = await prisma.customer.findMany({
    where: {
      assignedToId: userId,
      id: { notIn: Array.from(activeCustomerIds) as string[] },
      status: "ACTIVE",
    },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
    take: 10,
  });

  // Get pending quotes (7+ days without response)
  const pendingQuotes = await prisma.quotation.findMany({
    where: {
      createdById: userId,
      status: QuotationStatus.SENT,
      createdAt: { lte: ranges.sevenDaysAgo },
    },
    include: {
      customer: {
        select: { id: true, companyName: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  // Get recent activities (last 10 from all users)
  const recentActivities = await prisma.activity.findMany({
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      customer: {
        select: { companyName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    metrics: {
      quotesThisWeek,
      quotesThisMonth,
      quotesWonThisMonth,
      winRateThisMonth,
      customersContactedThisMonth,
    },
    upcomingFollowUps: upcomingFollowUps.map((fu) => ({
      id: fu.id,
      subject: fu.subject || "Follow-up",
      description: fu.description,
      dueDate: fu.dueDate!,
      customerName: fu.customer?.companyName || "Unknown",
      customerId: fu.customer?.id || "",
    })),
    customersToCall: customersToCallRaw.map((c) => {
      const lastContact = c.activities[0]?.createdAt;
      const daysSinceContact = lastContact
        ? Math.floor(
            (ranges.now.getTime() - new Date(lastContact).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;
      return {
        id: c.id,
        companyName: c.companyName,
        lastContactDate: lastContact || null,
        daysSinceContact,
      };
    }),
    pendingQuotes: pendingQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      customerName: q.customer?.companyName || "Unknown",
      customerId: q.customer?.id || "",
      createdAt: q.createdAt,
      daysPending: Math.floor(
        (ranges.now.getTime() - new Date(q.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      totalCost: q.totalCost ? Number(q.totalCost) : null,
      currency: q.currency,
    })),
    recentActivities: recentActivities.map((a) => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      description: a.description,
      createdAt: a.createdAt,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      customerName: a.customer?.companyName || null,
    })),
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const ranges = getDateRanges();

  // Get metrics
  const [
    quotesGivenThisWeek,
    quotesGivenThisMonth,
    quotesGivenLastMonth,
    quotesWonThisWeek,
    quotesWonThisMonth,
    quotesWonLastMonth,
    activeCustomerCount,
    highPotentialCustomerCount,
  ] = await Promise.all([
    prisma.quotation.count({
      where: { createdAt: { gte: ranges.startOfWeek } },
    }),
    prisma.quotation.count({
      where: { createdAt: { gte: ranges.startOfMonth } },
    }),
    prisma.quotation.count({
      where: {
        createdAt: { gte: ranges.startOfLastMonth, lte: ranges.endOfLastMonth },
      },
    }),
    prisma.quotation.count({
      where: {
        status: QuotationStatus.ACCEPTED,
        createdAt: { gte: ranges.startOfWeek },
      },
    }),
    prisma.quotation.count({
      where: {
        status: QuotationStatus.ACCEPTED,
        createdAt: { gte: ranges.startOfMonth },
      },
    }),
    prisma.quotation.count({
      where: {
        status: QuotationStatus.ACCEPTED,
        createdAt: { gte: ranges.startOfLastMonth, lte: ranges.endOfLastMonth },
      },
    }),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.customer.count({ where: { status: "PROSPECT" } }),
  ]);

  const winRateThisMonth = quotesGivenThisMonth > 0 
    ? Math.round((quotesWonThisMonth / quotesGivenThisMonth) * 100) 
    : 0;

  // Get personnel performance
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
  });

  const personnelPerformance: PersonnelPerformance[] = await Promise.all(
    users.map(async (user) => {
      const [quotesGiven, quotesWon, customersContacted] = await Promise.all([
        prisma.quotation.count({
          where: { createdById: user.id, createdAt: { gte: ranges.startOfMonth } },
        }),
        prisma.quotation.count({
          where: {
            createdById: user.id,
            status: QuotationStatus.ACCEPTED,
            createdAt: { gte: ranges.startOfMonth },
          },
        }),
        prisma.activity.count({
          where: {
            userId: user.id,
            customerId: { not: null },
            createdAt: { gte: ranges.startOfMonth },
          },
        }),
      ]);

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        quotesGiven,
        quotesWon,
        winRate: quotesGiven > 0 ? Math.round((quotesWon / quotesGiven) * 100) : 0,
        customersContacted,
      };
    })
  );

  // Sort by quotes given descending
  personnelPerformance.sort((a, b) => b.quotesGiven - a.quotesGiven);

  // Get top origin countries
  const originCountryStats = await prisma.quotation.groupBy({
    by: ["originCountry"],
    where: { createdAt: { gte: ranges.startOfMonth } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // Get top destination countries
  const destinationCountryStats = await prisma.quotation.groupBy({
    by: ["destinationCountry"],
    where: { createdAt: { gte: ranges.startOfMonth } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // Get mode distribution
  const modeStatsRaw = await prisma.quotation.groupBy({
    by: ["transportMode"],
    where: { createdAt: { gte: ranges.startOfMonth } },
    _count: { id: true },
  });

  const modeWinStats = await Promise.all(
    modeStatsRaw.map(async (stat) => {
      const won = await prisma.quotation.count({
        where: {
          transportMode: stat.transportMode,
          status: QuotationStatus.ACCEPTED,
          createdAt: { gte: ranges.startOfMonth },
        },
      });
      return {
        mode: stat.transportMode,
        quoteCount: stat._count.id,
        winRate: stat._count.id > 0 ? Math.round((won / stat._count.id) * 100) : 0,
      };
    })
  );

  // Get loss reason analysis
  const lossReasonStats = await prisma.quotation.groupBy({
    by: ["lossReason"],
    where: {
      status: QuotationStatus.REJECTED,
      createdAt: { gte: ranges.startOfMonth },
    },
    _count: { id: true },
  });

  const totalLosses = lossReasonStats.reduce((sum, r) => sum + r._count.id, 0);

  return {
    metrics: {
      quotesGivenThisWeek,
      quotesGivenThisMonth,
      quotesGivenLastMonth,
      quotesWonThisWeek,
      quotesWonThisMonth,
      quotesWonLastMonth,
      winRateThisMonth,
      activeCustomerCount,
      highPotentialCustomerCount,
    },
    personnelPerformance,
    topOriginCountries: originCountryStats.map((s) => ({
      country: s.originCountry,
      quoteCount: s._count.id,
    })),
    topDestinationCountries: destinationCountryStats.map((s) => ({
      country: s.destinationCountry,
      quoteCount: s._count.id,
    })),
    modeDistribution: modeWinStats.sort((a, b) => b.quoteCount - a.quoteCount),
    lossReasonAnalysis: lossReasonStats.map((s) => ({
      reason: s.lossReason || "Other",
      count: s._count.id,
      rate: totalLosses > 0 ? Math.round((s._count.id / totalLosses) * 100) : 0,
    })),
  };
}
