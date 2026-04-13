import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export async function userDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;
  const now = new Date();

  // Start of this week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  // Start of this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    weekQuotes,
    monthQuotes,
    wonQuotes,
    contactedCustomers,
    totalCustomers,
    pendingQuotes,
    recentActivities,
  ] = await Promise.all([
    // This week's quotations count
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        createdAt: { gte: weekStart },
        isDeleted: false,
      },
    }),
    // This month's quotations count
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        createdAt: { gte: monthStart },
        isDeleted: false,
      },
    }),
    // Won quotations this month
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        status: 'Kazanildi',
        updatedAt: { gte: monthStart },
        isDeleted: false,
      },
    }),
    // Contacted customers this month
    prisma.customer.count({
      where: {
        assignedUserId: userId,
        lastContactDate: { gte: monthStart },
        isDeleted: false,
      },
    }),
    // Total assigned customers
    prisma.customer.count({
      where: {
        assignedUserId: userId,
        isDeleted: false,
      },
    }),
    // Pending quotations
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        status: 'Bekliyor',
        isDeleted: false,
      },
    }),
    // Recent activities
    prisma.activity.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
      },
      include: {
        customer: { select: { id: true, companyName: true } },
      },
      orderBy: { activityDate: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: {
      weekQuotes,
      monthQuotes,
      wonQuotes,
      contactedCustomers,
      totalCustomers,
      pendingQuotes,
      recentActivities,
    },
  });
}

export async function adminDashboard(_req: Request, res: Response) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Team KPIs
  const [
    totalCustomers,
    totalQuotesMonth,
    wonQuotesMonth,
    lostQuotesMonth,
    totalActivitiesMonth,
  ] = await Promise.all([
    prisma.customer.count({ where: { isDeleted: false } }),
    prisma.quotation.count({
      where: { createdAt: { gte: monthStart }, isDeleted: false },
    }),
    prisma.quotation.count({
      where: { status: 'Kazanildi', updatedAt: { gte: monthStart }, isDeleted: false },
    }),
    prisma.quotation.count({
      where: { status: 'Kaybedildi', updatedAt: { gte: monthStart }, isDeleted: false },
    }),
    prisma.activity.count({
      where: { createdAt: { gte: monthStart }, isDeleted: false },
    }),
  ]);

  const winRate = totalQuotesMonth > 0
    ? Math.round((wonQuotesMonth / (wonQuotesMonth + lostQuotesMonth)) * 100)
    : 0;

  // Per-user performance table
  const users = await prisma.user.findMany({
    where: { isActive: true, role: 'USER' },
    select: { id: true, fullName: true },
  });

  const performanceTable = await Promise.all(
    users.map(async (user) => {
      const [quotes, won, activities, customers] = await Promise.all([
        prisma.quotation.count({
          where: { assignedUserId: user.id, createdAt: { gte: monthStart }, isDeleted: false },
        }),
        prisma.quotation.count({
          where: { assignedUserId: user.id, status: 'Kazanildi', updatedAt: { gte: monthStart }, isDeleted: false },
        }),
        prisma.activity.count({
          where: { createdById: user.id, createdAt: { gte: monthStart }, isDeleted: false },
        }),
        prisma.customer.count({
          where: { assignedUserId: user.id, isDeleted: false },
        }),
      ]);

      return {
        userId: user.id,
        fullName: user.fullName,
        quotesThisMonth: quotes,
        wonThisMonth: won,
        activitiesThisMonth: activities,
        totalCustomers: customers,
      };
    })
  );

  res.json({
    success: true,
    data: {
      kpis: {
        totalCustomers,
        totalQuotesMonth,
        wonQuotesMonth,
        lostQuotesMonth,
        winRate,
        totalActivitiesMonth,
      },
      performanceTable,
    },
  });
}

export async function alerts(req: Request, res: Response) {
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === 'ADMIN';
  const now = new Date();

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const userFilter = isAdmin ? {} : { assignedUserId: userId };
  const userFilterCreated = isAdmin ? {} : { createdById: userId };

  const [uncalledCustomers, pendingOldQuotes, expiredQuotes] = await Promise.all([
    // Customers not contacted in 14+ days
    prisma.customer.findMany({
      where: {
        ...userFilter,
        isDeleted: false,
        status: 'Aktif',
        OR: [
          { lastContactDate: { lt: fourteenDaysAgo } },
          { lastContactDate: null },
        ],
      },
      select: {
        id: true,
        companyName: true,
        lastContactDate: true,
        assignedUser: { select: { id: true, fullName: true } },
      },
      orderBy: { lastContactDate: 'asc' },
      take: 20,
    }),

    // Pending quotes older than 7 days
    prisma.quotation.findMany({
      where: {
        ...userFilter,
        isDeleted: false,
        status: 'Bekliyor',
        createdAt: { lt: sevenDaysAgo },
      },
      select: {
        id: true,
        quoteNo: true,
        customer: { select: { id: true, companyName: true } },
        createdAt: true,
        assignedUser: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    }),

    // Expired quotations (validityDate passed, still pending)
    prisma.quotation.findMany({
      where: {
        ...userFilter,
        isDeleted: false,
        status: 'Bekliyor',
        validityDate: { lt: now },
      },
      select: {
        id: true,
        quoteNo: true,
        customer: { select: { id: true, companyName: true } },
        validityDate: true,
        assignedUser: { select: { id: true, fullName: true } },
      },
      orderBy: { validityDate: 'asc' },
      take: 20,
    }),
  ]);

  res.json({
    success: true,
    data: {
      uncalledCustomers,
      pendingOldQuotes,
      expiredQuotes,
    },
  });
}
