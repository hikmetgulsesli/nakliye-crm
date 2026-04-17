import { Request, Response } from 'express';
import { prisma } from '../../config/database';

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  switch (period) {
    case 'this_week': {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end: endOfLastMonth };
    }
    case 'this_month':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
  }
}

// Country flag mapping helper
const COUNTRY_FLAGS: Record<string, string> = {
  'Türkiye': '\uD83C\uDDF9\uD83C\uDDF7',
  'Çin': '\uD83C\uDDE8\uD83C\uDDF3',
  'Almanya': '\uD83C\uDDE9\uD83C\uDDEA',
  'ABD': '\uD83C\uDDFA\uD83C\uDDF8',
  'İngiltere': '\uD83C\uDDEC\uD83C\uDDE7',
  'Fransa': '\uD83C\uDDEB\uD83C\uDDF7',
  'İtalya': '\uD83C\uDDEE\uD83C\uDDF9',
  'İspanya': '\uD83C\uDDEA\uD83C\uDDF8',
  'Rusya': '\uD83C\uDDF7\uD83C\uDDFA',
  'BAE': '\uD83C\uDDE6\uD83C\uDDEA',
  'Japonya': '\uD83C\uDDEF\uD83C\uDDF5',
  'Guney Kore': '\uD83C\uDDF0\uD83C\uDDF7',
  'Hindistan': '\uD83C\uDDEE\uD83C\uDDF3',
  'Brezilya': '\uD83C\uDDE7\uD83C\uDDF7',
  'Hollanda': '\uD83C\uDDF3\uD83C\uDDF1',
  'Belcika': '\uD83C\uDDE7\uD83C\uDDEA',
  'Suudi Arabistan': '\uD83C\uDDF8\uD83C\uDDE6',
  'Misir': '\uD83C\uDDEA\uD83C\uDDEC',
  'Yunanistan': '\uD83C\uDDEC\uD83C\uDDF7',
  'Polonya': '\uD83C\uDDF5\uD83C\uDDF1',
};

// Transport mode color mapping
const TRANSPORT_MODE_COLORS: Record<string, string> = {
  'Deniz': 'blue',
  'Kara': 'emerald',
  'Hava': 'amber',
  'Demiryolu': 'slate',
  'Kombine': 'purple',
};

export async function userDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;
  const now = new Date();

  // Start of this week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  // Start of this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 14 days ago for uncalled customers
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  // 7 days ago for pending quotes
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    weekQuotes,
    monthQuotes,
    wonQuotes,
    contactedCustomers,
    // Alerts
    uncalledCount,
    pendingCount,
    expiredCount,
    highPotentialCount,
    // Follow-ups
    upcomingActivities,
    // Recent activities
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
        status: 'Kazanıldı',
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
    // Alert: uncalled customers (14+ days)
    prisma.customer.count({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        status: 'Aktif',
        OR: [
          { lastContactDate: { lt: fourteenDaysAgo } },
          { lastContactDate: null },
        ],
      },
    }),
    // Alert: pending old quotes (7+ days)
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        status: 'Bekliyor',
        createdAt: { lt: sevenDaysAgo },
      },
    }),
    // Alert: expired quotes
    prisma.quotation.count({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        status: 'Bekliyor',
        validityDate: { lt: now },
      },
    }),
    // Alert: high potential customers
    prisma.customer.count({
      where: {
        assignedUserId: userId,
        isDeleted: false,
        potential: 'Yüksek',
      },
    }),
    // Follow-ups: upcoming activities (future or today)
    prisma.activity.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
        activityDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      include: {
        customer: { select: { id: true, companyName: true } },
      },
      orderBy: { activityDate: 'asc' },
      take: 5,
    }),
    // Recent activities
    prisma.activity.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
      },
      include: {
        customer: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { activityDate: 'desc' },
      take: 10,
    }),
  ]);

  // Build KPI cards
  const kpis = [
    {
      icon: 'assignment',
      iconColor: 'blue',
      label: 'Bu Haftaki Teklifler',
      value: weekQuotes,
    },
    {
      icon: 'receipt_long',
      iconColor: 'indigo',
      label: 'Bu Ay Teklifler',
      value: monthQuotes,
    },
    {
      icon: 'emoji_events',
      iconColor: 'emerald',
      label: 'Kazanılan Teklifler',
      value: wonQuotes,
    },
    {
      icon: 'handshake',
      iconColor: 'purple',
      label: 'Görüşülen Müşteri',
      value: contactedCustomers,
    },
  ];

  // Build alerts
  const alerts = [
    {
      id: 'uncalled',
      type: 'uncalled',
      count: uncalledCount,
      description: '14 gundur aranmadi',
    },
    {
      id: 'pending',
      type: 'pending',
      count: pendingCount,
      description: '7+ gün dönüş bekliyor',
    },
    {
      id: 'expired',
      type: 'expired',
      count: expiredCount,
      description: 'Süresi dolan teklifler',
    },
    {
      id: 'highPotential',
      type: 'highPotential',
      count: highPotentialCount,
      description: 'Yüksek potansiyelli müşteriler',
    },
  ];

  // Map follow-ups
  const followUps = upcomingActivities.map((a) => {
    const actDate = new Date(a.activityDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let dateStr: string;
    if (actDate >= today && actDate < tomorrow) {
      dateStr = `Bugün, ${actDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (actDate >= tomorrow && actDate < new Date(tomorrow.getTime() + 86400000)) {
      dateStr = `Yarin, ${actDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      dateStr = actDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) +
        ', ' + actDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    // Map activity type to follow-up type
    let type: 'call' | 'email' | 'meeting' = 'call';
    const actType = (a.activityType || '').toLowerCase();
    if (actType.includes('email') || actType.includes('e-posta')) type = 'email';
    else if (actType.includes('toplanti') || actType.includes('meeting') || actType.includes('ziyaret')) type = 'meeting';

    return {
      id: a.id.toString(),
      customerName: a.customer?.companyName || 'Bilinmeyen',
      date: dateStr,
      type,
      note: a.notes || '',
    };
  });

  // Map recent activities with relative dates
  const mappedActivities = recentActivities.map((a) => {
    const actDate = new Date(a.activityDate);
    const diffMs = now.getTime() - actDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let dateStr: string;
    if (diffHours < 1) dateStr = 'Az önce';
    else if (diffHours < 24) dateStr = `${diffHours} saat önce`;
    else if (diffDays === 1) {
      dateStr = `Dun, ${actDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      dateStr = `${diffDays} gün önce`;
    }

    return {
      id: a.id.toString(),
      date: dateStr,
      customerName: a.customer?.companyName || 'Bilinmeyen',
      type: a.activityType || 'Not',
      note: a.notes || '',
      representative: a.createdBy?.fullName || '',
    };
  });

  res.json({
    success: true,
    data: {
      kpis,
      alerts,
      followUps,
      recentActivities: mappedActivities,
    },
  });
}

export async function adminDashboard(req: Request, res: Response) {
  const period = (req.query.period as string) || 'this_month';
  const { start: periodStart, end: periodEnd } = getPeriodRange(period);
  const now = new Date();

  // Previous period for trend calculation
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const prevStart = new Date(periodStart.getTime() - periodDuration);
  const prevEnd = new Date(periodStart);

  // Team KPIs
  const [
    totalQuotesPeriod,
    wonQuotesPeriod,
    lostQuotesPeriod,
    activeCustomers,
    highPotentialCustomers,
    // Previous period for trends
    prevTotalQuotes,
    prevWonQuotes,
    prevActiveCustomers,
    // Aggregation data
    quotationsInPeriod,
    lostQuotations,
  ] = await Promise.all([
    prisma.quotation.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
    }),
    prisma.quotation.count({
      where: { status: 'Kazanıldı', updatedAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
    }),
    prisma.quotation.count({
      where: { status: 'Kaybedildi', updatedAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
    }),
    prisma.customer.count({
      where: { isDeleted: false, status: 'Aktif' },
    }),
    prisma.customer.count({
      where: { isDeleted: false, potential: 'Yüksek' },
    }),
    // Previous period totals for trends
    prisma.quotation.count({
      where: { createdAt: { gte: prevStart, lt: prevEnd }, isDeleted: false },
    }),
    prisma.quotation.count({
      where: { status: 'Kazanıldı', updatedAt: { gte: prevStart, lt: prevEnd }, isDeleted: false },
    }),
    prisma.customer.count({
      where: { isDeleted: false, status: 'Aktif', createdAt: { lt: prevEnd } },
    }),
    // All quotations in period for aggregation
    prisma.quotation.findMany({
      where: { createdAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
      select: {
        originCountry: true,
        destinationCountry: true,
        transportMode: true,
      },
    }),
    // Lost quotations for loss reasons
    prisma.quotation.findMany({
      where: { status: 'Kaybedildi', updatedAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
      select: { lossReason: true },
    }),
  ]);

  const winRate = (wonQuotesPeriod + lostQuotesPeriod) > 0
    ? Math.round((wonQuotesPeriod / (wonQuotesPeriod + lostQuotesPeriod)) * 100)
    : 0;

  // Calculate trends
  function calcTrend(current: number, previous: number): { value: string; positive: boolean } {
    if (previous === 0) {
      return current > 0
        ? { value: `+${current}`, positive: true }
        : { value: 'Stabil', positive: true };
    }
    const pct = Math.round(((current - previous) / previous) * 100);
    return {
      value: pct >= 0 ? `+${pct}%` : `${pct}%`,
      positive: pct >= 0,
    };
  }

  // Build KPI cards
  const kpis = [
    {
      icon: 'description',
      iconColor: 'blue',
      label: 'Verilen Teklif',
      value: totalQuotesPeriod,
      trend: calcTrend(totalQuotesPeriod, prevTotalQuotes),
    },
    {
      icon: 'check_circle',
      iconColor: 'emerald',
      label: 'Kazanılan',
      value: wonQuotesPeriod,
      trend: calcTrend(wonQuotesPeriod, prevWonQuotes),
    },
    {
      icon: 'track_changes',
      iconColor: 'purple',
      label: 'Kazanma Oranı',
      value: `%${winRate}`,
    },
    {
      icon: 'groups',
      iconColor: 'slate',
      label: 'Aktif Müşteri',
      value: activeCustomers,
      trend: calcTrend(activeCustomers, prevActiveCustomers),
    },
    {
      icon: 'star',
      iconColor: 'amber',
      label: 'Yüksek Potansiyel',
      value: highPotentialCustomers,
    },
  ];

  // Per-user performance table
  const users = await prisma.user.findMany({
    where: { isActive: true, role: 'USER' },
    select: { id: true, fullName: true },
  });

  const performanceTable = await Promise.all(
    users.map(async (user) => {
      const [quotes, won, activities, customers, lastAct] = await Promise.all([
        prisma.quotation.count({
          where: { assignedUserId: user.id, createdAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
        }),
        prisma.quotation.count({
          where: { assignedUserId: user.id, status: 'Kazanıldı', updatedAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
        }),
        prisma.activity.count({
          where: { createdById: user.id, createdAt: { gte: periodStart, lte: periodEnd }, isDeleted: false },
        }),
        prisma.customer.count({
          where: { assignedUserId: user.id, isDeleted: false },
        }),
        prisma.activity.findFirst({
          where: { createdById: user.id, isDeleted: false },
          orderBy: { activityDate: 'desc' },
          select: { activityDate: true },
        }),
      ]);

      const userWinRate = (quotes > 0) ? Math.round((won / quotes) * 100) : 0;

      // Format last activity as relative time
      let lastActivity = '-';
      if (lastAct?.activityDate) {
        const diffMs = now.getTime() - new Date(lastAct.activityDate).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHours < 1) lastActivity = 'Az önce';
        else if (diffHours < 24) lastActivity = `${diffHours} saat önce`;
        else if (diffDays === 1) lastActivity = 'Dun';
        else lastActivity = `${diffDays} gün önce`;
      }

      return {
        id: user.id.toString(),
        name: user.fullName,
        quoteCount: quotes,
        wonCount: won,
        winRate: userWinRate,
        contactedCustomers: customers,
        lastActivity,
        isTopPerformer: false, // will be set below
      };
    })
  );

  // Mark top performer
  if (performanceTable.length > 0) {
    const topIdx = performanceTable.reduce((best, cur, idx) =>
      cur.wonCount > performanceTable[best].wonCount ? idx : best, 0);
    if (performanceTable[topIdx].wonCount > 0) {
      performanceTable[topIdx].isTopPerformer = true;
    }
  }

  // Aggregate origin countries
  const originCounts: Record<string, number> = {};
  const destCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};

  for (const q of quotationsInPeriod) {
    if (q.originCountry) {
      originCounts[q.originCountry] = (originCounts[q.originCountry] || 0) + 1;
    }
    if (q.destinationCountry) {
      destCounts[q.destinationCountry] = (destCounts[q.destinationCountry] || 0) + 1;
    }
    if (q.transportMode) {
      modeCounts[q.transportMode] = (modeCounts[q.transportMode] || 0) + 1;
    }
  }

  const totalOrigin = Object.values(originCounts).reduce((a, b) => a + b, 0) || 1;
  const originCountries = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([country, count]) => ({
      country,
      flag: COUNTRY_FLAGS[country] || '\uD83C\uDFF3\uFE0F',
      percentage: Math.round((count / totalOrigin) * 100),
      count,
    }));

  const totalDest = Object.values(destCounts).reduce((a, b) => a + b, 0) || 1;
  const destinationCountries = Object.entries(destCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([country, count]) => ({
      country,
      flag: COUNTRY_FLAGS[country] || '\uD83C\uDFF3\uFE0F',
      percentage: Math.round((count / totalDest) * 100),
      count,
    }));

  const totalModes = Object.values(modeCounts).reduce((a, b) => a + b, 0) || 1;
  const transportModes = Object.entries(modeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, count]) => ({
      mode,
      percentage: Math.round((count / totalModes) * 100),
      color: TRANSPORT_MODE_COLORS[mode] || 'slate',
    }));

  // Aggregate loss reasons
  const lossCounts: Record<string, number> = {};
  for (const q of lostQuotations) {
    const reason = q.lossReason || 'Belirtilmemis';
    lossCounts[reason] = (lossCounts[reason] || 0) + 1;
  }
  const totalLoss = Object.values(lossCounts).reduce((a, b) => a + b, 0) || 1;
  const lossReasons = Object.entries(lossCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({
      reason,
      percentage: Math.round((count / totalLoss) * 100),
      count,
    }));

  res.json({
    success: true,
    data: {
      kpis,
      teamPerformance: performanceTable,
      originCountries,
      destinationCountries,
      transportModes,
      lossReasons,
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
