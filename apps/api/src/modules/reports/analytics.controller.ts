import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database';

// ============================================================================
// Yardimcilar
// ============================================================================

function decimalToNumber(d: Decimal | null | undefined): number {
  return d ? Number(d) : 0;
}

interface AnalyticsRange {
  start: Date;
  end: Date;
  /** Bir onceki donemin baslangici (trend hesabi icin) */
  prevStart: Date;
  /** Bir onceki donemin bitisi */
  prevEnd: Date;
}

function parseRange(req: Request): AnalyticsRange {
  const now = new Date();
  const start = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = req.query.endDate
    ? new Date(req.query.endDate as string)
    : new Date();
  end.setHours(23, 59, 59, 999);

  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start);
  const prevStart = new Date(start.getTime() - duration);
  return { start, end, prevStart, prevEnd };
}

function parseAssignedUserIds(req: Request): number[] | undefined {
  const raw = req.query.assignedUserIds;
  if (!raw) return undefined;
  const arr = Array.isArray(raw) ? raw : String(raw).split(',');
  const ids = arr
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length > 0 ? ids : undefined;
}

function quoteWhere(req: Request, range: AnalyticsRange): Prisma.QuotationWhereInput {
  const where: Prisma.QuotationWhereInput = {
    isDeleted: false,
    quoteDate: { gte: range.start, lte: range.end },
  };
  const userIds = parseAssignedUserIds(req);
  if (userIds) where.assignedUserId = { in: userIds };
  if (req.query.transportMode) where.transportMode = String(req.query.transportMode);
  if (req.query.currency) where.currency = String(req.query.currency);
  return where;
}

function activityWhere(req: Request, range: AnalyticsRange): Prisma.ActivityWhereInput {
  const where: Prisma.ActivityWhereInput = {
    isDeleted: false,
    activityDate: { gte: range.start, lte: range.end },
  };
  const userIds = parseAssignedUserIds(req);
  if (userIds) where.createdById = { in: userIds };
  return where;
}

function calcTrend(current: number, previous: number): { value: number; positive: boolean; label: string } {
  if (previous === 0) {
    if (current === 0) return { value: 0, positive: true, label: 'Stabil' };
    return { value: 100, positive: true, label: `+${current}` };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return {
    value: pct,
    positive: pct >= 0,
    label: pct >= 0 ? `+%${pct}` : `%${pct}`,
  };
}

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthlyBuckets(start: Date, end: Date): string[] {
  const buckets: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endCursor) {
    buckets.push(ymKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

// ============================================================================
// /reports/analytics/overview
// ============================================================================

export async function overview(req: Request, res: Response) {
  const range = parseRange(req);
  const where = quoteWhere(req, range);
  const prevWhere: Prisma.QuotationWhereInput = {
    ...where,
    quoteDate: { gte: range.prevStart, lt: range.prevEnd },
  };

  const [
    totalQuotes,
    wonQuotes,
    lostQuotes,
    pendingQuotes,
    prevTotal,
    prevWon,
    prevLost,
    activeCustomers,
    newCustomers,
    prevNewCustomers,
    quotationsRaw,
  ] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.count({ where: { ...where, status: 'Kazanıldı' } }),
    prisma.quotation.count({ where: { ...where, status: 'Kaybedildi' } }),
    prisma.quotation.count({ where: { ...where, status: 'Bekliyor' } }),
    prisma.quotation.count({ where: prevWhere }),
    prisma.quotation.count({ where: { ...prevWhere, status: 'Kazanıldı' } }),
    prisma.quotation.count({ where: { ...prevWhere, status: 'Kaybedildi' } }),
    prisma.customer.count({ where: { isDeleted: false, status: 'Aktif' } }),
    prisma.customer.count({
      where: { isDeleted: false, createdAt: { gte: range.start, lte: range.end } },
    }),
    prisma.customer.count({
      where: { isDeleted: false, createdAt: { gte: range.prevStart, lt: range.prevEnd } },
    }),
    prisma.quotation.findMany({
      where,
      select: { status: true, price: true, currency: true, quoteDate: true },
    }),
  ]);

  const closed = wonQuotes + lostQuotes;
  const winRate = closed > 0 ? Math.round((wonQuotes / closed) * 100) : 0;
  const prevClosed = prevWon + prevLost;
  const prevWinRate = prevClosed > 0 ? Math.round((prevWon / prevClosed) * 100) : 0;

  // Currency basina kazanilan toplam deger
  const wonValueByCurrency: Record<string, number> = {};
  for (const q of quotationsRaw) {
    if (q.status !== 'Kazanıldı') continue;
    const cur = q.currency || 'USD';
    wonValueByCurrency[cur] = (wonValueByCurrency[cur] || 0) + decimalToNumber(q.price);
  }

  // Aylik trend (teklif sayisi + kazanilan)
  const buckets = buildMonthlyBuckets(range.start, range.end);
  const monthlyMap = new Map<string, { total: number; won: number; lost: number }>();
  buckets.forEach((b) => monthlyMap.set(b, { total: 0, won: 0, lost: 0 }));
  for (const q of quotationsRaw) {
    const key = ymKey(new Date(q.quoteDate));
    const entry = monthlyMap.get(key);
    if (!entry) continue;
    entry.total++;
    if (q.status === 'Kazanıldı') entry.won++;
    else if (q.status === 'Kaybedildi') entry.lost++;
  }
  const monthlyTrend = buckets.map((month) => {
    const e = monthlyMap.get(month)!;
    const c = e.won + e.lost;
    return {
      month,
      total: e.total,
      won: e.won,
      lost: e.lost,
      winRate: c > 0 ? Math.round((e.won / c) * 100) : 0,
    };
  });

  res.json({
    success: true,
    data: {
      kpis: {
        totalQuotes: { value: totalQuotes, trend: calcTrend(totalQuotes, prevTotal) },
        wonQuotes: { value: wonQuotes, trend: calcTrend(wonQuotes, prevWon) },
        lostQuotes: { value: lostQuotes, trend: calcTrend(lostQuotes, prevLost) },
        pendingQuotes: { value: pendingQuotes },
        winRate: { value: winRate, trend: calcTrend(winRate, prevWinRate) },
        activeCustomers: { value: activeCustomers },
        newCustomers: { value: newCustomers, trend: calcTrend(newCustomers, prevNewCustomers) },
        wonValueByCurrency,
      },
      statusDistribution: [
        { status: 'Kazanıldı', count: wonQuotes },
        { status: 'Kaybedildi', count: lostQuotes },
        { status: 'Bekliyor', count: pendingQuotes },
        { status: 'İptal', count: totalQuotes - wonQuotes - lostQuotes - pendingQuotes },
      ],
      monthlyTrend,
      range: { start: range.start, end: range.end },
    },
  });
}

// ============================================================================
// /reports/analytics/team-performance
// ============================================================================

export async function teamPerformance(req: Request, res: Response) {
  const range = parseRange(req);
  const userIds = parseAssignedUserIds(req);

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    select: { id: true, fullName: true, role: true, avatarUrl: true },
    orderBy: { fullName: 'asc' },
  });

  const rows = await Promise.all(
    users.map(async (user) => {
      const baseWhere: Prisma.QuotationWhereInput = {
        isDeleted: false,
        assignedUserId: user.id,
        quoteDate: { gte: range.start, lte: range.end },
      };
      const [quotes, activitiesCount, customersCount, lastActivity, goalRows] = await Promise.all([
        prisma.quotation.findMany({
          where: baseWhere,
          select: { status: true, price: true, currency: true },
        }),
        prisma.activity.count({
          where: {
            isDeleted: false,
            createdById: user.id,
            activityDate: { gte: range.start, lte: range.end },
          },
        }),
        prisma.customer.count({
          where: { isDeleted: false, assignedUserId: user.id },
        }),
        prisma.activity.findFirst({
          where: { isDeleted: false, createdById: user.id },
          orderBy: { activityDate: 'desc' },
          select: { activityDate: true },
        }),
        prisma.salesGoal.findMany({
          where: {
            userId: user.id,
            periodStart: { lte: range.end },
            periodEnd: { gte: range.start },
          },
          select: { metric: true, target: true },
        }),
      ]);

      const total = quotes.length;
      const won = quotes.filter((q) => q.status === 'Kazanıldı').length;
      const lost = quotes.filter((q) => q.status === 'Kaybedildi').length;
      const pending = quotes.filter((q) => q.status === 'Bekliyor').length;
      const closed = won + lost;
      const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
      const wonValue: Record<string, number> = {};
      for (const q of quotes) {
        if (q.status !== 'Kazanıldı') continue;
        const cur = q.currency || 'USD';
        wonValue[cur] = (wonValue[cur] || 0) + decimalToNumber(q.price);
      }

      const goals: Record<string, { target: number; actual: number; pct: number }> = {};
      const metricActuals: Record<string, number> = {
        quote_count: total,
        won_count: won,
        activity_count: activitiesCount,
      };
      for (const g of goalRows) {
        const actual = metricActuals[g.metric] ?? 0;
        const target = g.target;
        const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
        goals[g.metric] = { target, actual, pct };
      }

      return {
        userId: user.id,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        totalQuotes: total,
        wonQuotes: won,
        lostQuotes: lost,
        pendingQuotes: pending,
        winRate,
        wonValue,
        activities: activitiesCount,
        customers: customersCount,
        lastActivityAt: lastActivity?.activityDate ?? null,
        goals,
      };
    }),
  );

  // Lider tablosu icin sirala
  rows.sort((a, b) => b.wonQuotes - a.wonQuotes || b.winRate - a.winRate);

  // Takim toplami
  const teamTotal = rows.reduce(
    (acc, r) => {
      acc.quotes += r.totalQuotes;
      acc.won += r.wonQuotes;
      acc.lost += r.lostQuotes;
      acc.activities += r.activities;
      return acc;
    },
    { quotes: 0, won: 0, lost: 0, activities: 0 },
  );

  res.json({
    success: true,
    data: {
      members: rows,
      summary: {
        ...teamTotal,
        winRate:
          teamTotal.won + teamTotal.lost > 0
            ? Math.round((teamTotal.won / (teamTotal.won + teamTotal.lost)) * 100)
            : 0,
      },
    },
  });
}

// ============================================================================
// /reports/analytics/quote-funnel
// ============================================================================

export async function quoteFunnel(req: Request, res: Response) {
  const range = parseRange(req);
  const where = quoteWhere(req, range);

  const quotations = await prisma.quotation.findMany({
    where,
    select: {
      status: true,
      price: true,
      currency: true,
      revisionCount: true,
      quoteDate: true,
      validityDate: true,
      lossReason: true,
      updatedAt: true,
    },
  });

  const total = quotations.length;
  const won = quotations.filter((q) => q.status === 'Kazanıldı').length;
  const lost = quotations.filter((q) => q.status === 'Kaybedildi').length;
  const pending = quotations.filter((q) => q.status === 'Bekliyor').length;
  const cancelled = quotations.filter((q) => q.status === 'İptal').length;
  const closed = won + lost;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
  const lossRate = closed > 0 ? Math.round((lost / closed) * 100) : 0;

  // Funnel sayilari (mantiksal akis)
  const funnel = [
    { stage: 'Olusturulan', count: total, color: '#6366f1' },
    { stage: 'Aktif (Bekliyor)', count: pending, color: '#3b82f6' },
    { stage: 'Sonuclanan', count: closed, color: '#8b5cf6' },
    { stage: 'Kazanılan', count: won, color: '#10b981' },
  ];

  // Status dagilimi
  const statusDistribution = [
    { status: 'Kazanıldı', count: won, percentage: total > 0 ? Math.round((won / total) * 100) : 0, color: '#10b981' },
    { status: 'Kaybedildi', count: lost, percentage: total > 0 ? Math.round((lost / total) * 100) : 0, color: '#ef4444' },
    { status: 'Bekliyor', count: pending, percentage: total > 0 ? Math.round((pending / total) * 100) : 0, color: '#3b82f6' },
    { status: 'İptal', count: cancelled, percentage: total > 0 ? Math.round((cancelled / total) * 100) : 0, color: '#94a3b8' },
  ];

  // Kayip nedenleri
  const reasonMap = new Map<string, { count: number; value: number }>();
  for (const q of quotations) {
    if (q.status !== 'Kaybedildi') continue;
    const reason = q.lossReason || 'Belirtilmemis';
    const e = reasonMap.get(reason) || { count: 0, value: 0 };
    e.count++;
    e.value += decimalToNumber(q.price);
    reasonMap.set(reason, e);
  }
  const lossReasons = Array.from(reasonMap.entries())
    .map(([reason, e]) => ({
      reason,
      count: e.count,
      value: e.value,
      percentage: lost > 0 ? Math.round((e.count / lost) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Ortalama revizyon
  const totalRevisions = quotations.reduce((sum, q) => sum + (q.revisionCount || 0), 0);
  const avgRevisions = total > 0 ? Math.round((totalRevisions / total) * 10) / 10 : 0;

  // Ortalama kazanma suresi (gun)
  const wonItems = quotations.filter((q) => q.status === 'Kazanıldı');
  const cycleDays = wonItems.map(
    (q) => (new Date(q.updatedAt).getTime() - new Date(q.quoteDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  const avgCycle = cycleDays.length > 0
    ? Math.round((cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10) / 10
    : 0;

  // Ortalama teklif degeri (kazanilan)
  const wonByCur: Record<string, { total: number; count: number }> = {};
  for (const q of wonItems) {
    const cur = q.currency || 'USD';
    const e = wonByCur[cur] || { total: 0, count: 0 };
    e.total += decimalToNumber(q.price);
    e.count++;
    wonByCur[cur] = e;
  }
  const avgWonValue = Object.entries(wonByCur).map(([cur, v]) => ({
    currency: cur,
    avg: v.count > 0 ? Math.round(v.total / v.count) : 0,
    total: v.total,
    count: v.count,
  }));

  res.json({
    success: true,
    data: {
      funnel,
      statusDistribution,
      lossReasons,
      metrics: {
        total,
        winRate,
        lossRate,
        avgRevisions,
        avgCycleDays: avgCycle,
        avgWonValue,
      },
    },
  });
}

// ============================================================================
// /reports/analytics/customer-segments
// ============================================================================

export async function customerSegments(req: Request, res: Response) {
  const range = parseRange(req);
  const userIds = parseAssignedUserIds(req);
  const customerWhere: Prisma.CustomerWhereInput = { isDeleted: false };
  if (userIds) customerWhere.assignedUserId = { in: userIds };

  const [
    customers,
    churnRows,
    newInPeriod,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: customerWhere,
      select: {
        id: true,
        potential: true,
        source: true,
        status: true,
        direction: true,
        lastContactDate: true,
        createdAt: true,
        assignedUserId: true,
      },
    }),
    prisma.churnRisk.findMany({
      select: { customerId: true, score: true, level: true },
    }),
    prisma.customer.count({
      where: {
        ...customerWhere,
        createdAt: { gte: range.start, lte: range.end },
      },
    }),
  ]);

  const churnByCustomer = new Map(churnRows.map((c) => [c.customerId, c]));

  const groupCount = <T extends string | null | undefined>(
    items: { value: T }[],
    fallback = 'Belirtilmemis',
  ) => {
    const map = new Map<string, number>();
    for (const it of items) {
      const k = it.value || fallback;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  };

  const byPotential = groupCount(customers.map((c) => ({ value: c.potential })));
  const bySource = groupCount(customers.map((c) => ({ value: c.source })));
  const byStatus = groupCount(customers.map((c) => ({ value: c.status })));
  const byDirection = groupCount(customers.map((c) => ({ value: c.direction })));

  // Son temas durumu
  const now = new Date();
  const buckets = { fresh: 0, recent: 0, stale: 0, cold: 0, never: 0 };
  for (const c of customers) {
    if (!c.lastContactDate) {
      buckets.never++;
      continue;
    }
    const days = (now.getTime() - new Date(c.lastContactDate).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 7) buckets.fresh++;
    else if (days <= 30) buckets.recent++;
    else if (days <= 90) buckets.stale++;
    else buckets.cold++;
  }
  const contactBuckets = [
    { label: 'Son 7 gunde', key: 'fresh', count: buckets.fresh, color: '#10b981' },
    { label: '7-30 gun', key: 'recent', count: buckets.recent, color: '#3b82f6' },
    { label: '30-90 gun', key: 'stale', count: buckets.stale, color: '#f59e0b' },
    { label: '90+ gun', key: 'cold', count: buckets.cold, color: '#ef4444' },
    { label: 'Hiç', key: 'never', count: buckets.never, color: '#94a3b8' },
  ];

  // Churn dagilimi
  const churnDist = { low: 0, medium: 0, high: 0, critical: 0, none: 0 };
  for (const c of customers) {
    const r = churnByCustomer.get(c.id);
    if (!r) {
      churnDist.none++;
      continue;
    }
    const level = (r.level || '').toLowerCase();
    if (level === 'low') churnDist.low++;
    else if (level === 'medium') churnDist.medium++;
    else if (level === 'high') churnDist.high++;
    else if (level === 'critical') churnDist.critical++;
    else churnDist.none++;
  }

  res.json({
    success: true,
    data: {
      total: customers.length,
      newInPeriod,
      byPotential,
      bySource,
      byStatus,
      byDirection,
      contactBuckets,
      churnDistribution: [
        { level: 'Dusuk', key: 'low', count: churnDist.low, color: '#10b981' },
        { level: 'Orta', key: 'medium', count: churnDist.medium, color: '#f59e0b' },
        { level: 'Yuksek', key: 'high', count: churnDist.high, color: '#ef4444' },
        { level: 'Kritik', key: 'critical', count: churnDist.critical, color: '#991b1b' },
        { level: 'Skorlanmamis', key: 'none', count: churnDist.none, color: '#cbd5e1' },
      ],
    },
  });
}

// ============================================================================
// /reports/analytics/lane-analysis
// ============================================================================

export async function laneAnalysis(req: Request, res: Response) {
  const range = parseRange(req);
  const where = quoteWhere(req, range);

  const quotations = await prisma.quotation.findMany({
    where,
    select: {
      originCountry: true,
      destinationCountry: true,
      transportMode: true,
      serviceType: true,
      incoterm: true,
      price: true,
      currency: true,
      status: true,
    },
  });

  // Lane (origin -> destination)
  const laneMap = new Map<string, { count: number; won: number; value: number }>();
  for (const q of quotations) {
    const key = `${q.originCountry || '-'}|${q.destinationCountry || '-'}`;
    const e = laneMap.get(key) || { count: 0, won: 0, value: 0 };
    e.count++;
    if (q.status === 'Kazanıldı') {
      e.won++;
      e.value += decimalToNumber(q.price);
    }
    laneMap.set(key, e);
  }
  const lanes = Array.from(laneMap.entries())
    .map(([key, v]) => {
      const [origin, destination] = key.split('|');
      return {
        origin,
        destination,
        count: v.count,
        won: v.won,
        winRate: v.count > 0 ? Math.round((v.won / v.count) * 100) : 0,
        wonValue: v.value,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Tek tarafli ulke dagilimi
  const aggregate = (key: 'originCountry' | 'destinationCountry') => {
    const map = new Map<string, number>();
    for (const q of quotations) {
      const k = q[key] || 'Belirtilmemis';
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };
  const origins = aggregate('originCountry');
  const destinations = aggregate('destinationCountry');

  // Mod dagilimi
  const modeMap = new Map<string, { count: number; won: number }>();
  for (const q of quotations) {
    const k = q.transportMode || 'Belirtilmemis';
    const e = modeMap.get(k) || { count: 0, won: 0 };
    e.count++;
    if (q.status === 'Kazanıldı') e.won++;
    modeMap.set(k, e);
  }
  const transportModes = Array.from(modeMap.entries())
    .map(([mode, v]) => ({
      mode,
      count: v.count,
      won: v.won,
      winRate: v.count > 0 ? Math.round((v.won / v.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Servis tipi
  const serviceMap = new Map<string, number>();
  for (const q of quotations) {
    const k = q.serviceType || 'Belirtilmemis';
    serviceMap.set(k, (serviceMap.get(k) || 0) + 1);
  }
  const serviceTypes = Array.from(serviceMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Incoterm
  const incoMap = new Map<string, number>();
  for (const q of quotations) {
    if (!q.incoterm) continue;
    incoMap.set(q.incoterm, (incoMap.get(q.incoterm) || 0) + 1);
  }
  const incoterms = Array.from(incoMap.entries())
    .map(([incoterm, count]) => ({ incoterm, count }))
    .sort((a, b) => b.count - a.count);

  res.json({
    success: true,
    data: { lanes, origins, destinations, transportModes, serviceTypes, incoterms },
  });
}

// ============================================================================
// /reports/analytics/activity-heatmap
// ============================================================================

export async function activityHeatmap(req: Request, res: Response) {
  const range = parseRange(req);
  const where = activityWhere(req, range);

  const activities = await prisma.activity.findMany({
    where,
    select: {
      activityDate: true,
      activityType: true,
      durationMinutes: true,
      createdById: true,
    },
  });

  // Heatmap (gun=0 Pazartesi ... 6 Pazar, saat=0..23)
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const a of activities) {
    const d = new Date(a.activityDate);
    const day = (d.getDay() + 6) % 7; // Pazartesi=0
    const hour = d.getHours();
    heatmap[day][hour]++;
  }

  // Tip dagilimi
  const typeMap = new Map<string, number>();
  for (const a of activities) {
    const t = a.activityType || 'Diger';
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  }
  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Kullanici basina aktivite
  const userIds = Array.from(new Set(activities.map((a) => a.createdById)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds.length > 0 ? userIds : [-1] } },
    select: { id: true, fullName: true },
  });
  const nameMap = new Map(users.map((u) => [u.id, u.fullName]));
  const userMap = new Map<number, number>();
  for (const a of activities) {
    userMap.set(a.createdById, (userMap.get(a.createdById) || 0) + 1);
  }
  const byUser = Array.from(userMap.entries())
    .map(([userId, count]) => ({
      userId,
      fullName: nameMap.get(userId) || `#${userId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Toplam dakika
  const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  res.json({
    success: true,
    data: {
      heatmap,
      byType,
      byUser,
      summary: {
        totalActivities: activities.length,
        totalMinutes,
        avgPerDay:
          activities.length > 0
            ? Math.round(
                activities.length /
                  Math.max(
                    1,
                    Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000),
                  ),
              )
            : 0,
      },
    },
  });
}

// ============================================================================
// /reports/analytics/revenue-trend
// ============================================================================

export async function revenueTrend(req: Request, res: Response) {
  const range = parseRange(req);
  const where: Prisma.QuotationWhereInput = {
    ...quoteWhere(req, range),
    status: 'Kazanıldı',
  };

  const wonQuotes = await prisma.quotation.findMany({
    where,
    select: { quoteDate: true, price: true, currency: true },
  });

  const buckets = buildMonthlyBuckets(range.start, range.end);
  const currencies = Array.from(new Set(wonQuotes.map((q) => q.currency || 'USD')));

  // ay -> currency -> total
  const matrix = new Map<string, Record<string, number>>();
  buckets.forEach((b) => {
    const row: Record<string, number> = {};
    currencies.forEach((c) => (row[c] = 0));
    matrix.set(b, row);
  });

  for (const q of wonQuotes) {
    const k = ymKey(new Date(q.quoteDate));
    const row = matrix.get(k);
    if (!row) continue;
    const c = q.currency || 'USD';
    row[c] = (row[c] || 0) + decimalToNumber(q.price);
  }

  const series = buckets.map((month) => ({
    month,
    ...matrix.get(month)!,
  }));

  // Toplamlar
  const totals: Record<string, number> = {};
  currencies.forEach((c) => (totals[c] = 0));
  for (const q of wonQuotes) {
    const c = q.currency || 'USD';
    totals[c] = (totals[c] || 0) + decimalToNumber(q.price);
  }

  res.json({
    success: true,
    data: {
      series,
      currencies,
      totals,
      wonCount: wonQuotes.length,
    },
  });
}

// ============================================================================
// /reports/analytics/top-customers
// ============================================================================

export async function topCustomers(req: Request, res: Response) {
  const range = parseRange(req);
  const where = quoteWhere(req, range);

  const quotations = await prisma.quotation.findMany({
    where,
    select: {
      customerId: true,
      status: true,
      price: true,
      currency: true,
      customer: { select: { id: true, companyName: true, potential: true } },
    },
  });

  type Agg = {
    customerId: number;
    companyName: string;
    potential: string | null;
    quoteCount: number;
    wonCount: number;
    wonValue: Record<string, number>;
  };
  const map = new Map<number, Agg>();
  for (const q of quotations) {
    if (!q.customer) continue;
    const e =
      map.get(q.customerId) || {
        customerId: q.customerId,
        companyName: q.customer.companyName,
        potential: q.customer.potential,
        quoteCount: 0,
        wonCount: 0,
        wonValue: {},
      };
    e.quoteCount++;
    if (q.status === 'Kazanıldı') {
      e.wonCount++;
      const c = q.currency || 'USD';
      e.wonValue[c] = (e.wonValue[c] || 0) + decimalToNumber(q.price);
    }
    map.set(q.customerId, e);
  }

  const list = Array.from(map.values()).map((c) => ({
    ...c,
    winRate: c.quoteCount > 0 ? Math.round((c.wonCount / c.quoteCount) * 100) : 0,
    primaryValue:
      c.wonValue['USD'] ||
      c.wonValue['EUR'] ||
      c.wonValue['TRY'] ||
      Object.values(c.wonValue)[0] ||
      0,
  }));

  const byQuoteCount = [...list].sort((a, b) => b.quoteCount - a.quoteCount).slice(0, 10);
  const byWonCount = [...list].sort((a, b) => b.wonCount - a.wonCount).slice(0, 10);
  const byValue = [...list].sort((a, b) => b.primaryValue - a.primaryValue).slice(0, 10);

  res.json({
    success: true,
    data: { byQuoteCount, byWonCount, byValue },
  });
}

// ============================================================================
// /reports/analytics/pipeline
// Aktif satis borusu — bekleyen tekliflerin mevcut durumu
// ============================================================================

export async function pipeline(req: Request, res: Response) {
  // Pipeline donemden bagimsiz, tum bekleyen teklifler. Filter sadece temsilci ve mod.
  const userIds = parseAssignedUserIds(req);
  const where: Prisma.QuotationWhereInput = {
    isDeleted: false,
    status: 'Bekliyor',
  };
  if (userIds) where.assignedUserId = { in: userIds };
  if (req.query.transportMode) where.transportMode = String(req.query.transportMode);
  if (req.query.currency) where.currency = String(req.query.currency);

  const pendingQuotes = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, companyName: true, potential: true } },
      assignedUser: { select: { id: true, fullName: true } },
    },
  });

  const now = new Date();

  // Yas kovalari
  const buckets = {
    under7: { label: '0-7 gun', count: 0, value: {} as Record<string, number>, color: '#10b981' },
    under14: { label: '8-14 gun', count: 0, value: {} as Record<string, number>, color: '#3b82f6' },
    under30: { label: '15-30 gun', count: 0, value: {} as Record<string, number>, color: '#f59e0b' },
    over30: { label: '30+ gun', count: 0, value: {} as Record<string, number>, color: '#ef4444' },
    expired: { label: 'Vadesi gecti', count: 0, value: {} as Record<string, number>, color: '#991b1b' },
  };

  const oldestList: Array<{
    id: number;
    quoteNo: string;
    customerName: string;
    assignedUserName: string;
    quoteDate: Date;
    validityDate: Date;
    ageDays: number;
    isExpired: boolean;
    price: number;
    currency: string;
  }> = [];

  // Toplam beklenen deger
  const expectedValue: Record<string, number> = {};
  // Temsilci basina pipeline
  const byUserMap = new Map<number, {
    userId: number;
    fullName: string;
    count: number;
    value: Record<string, number>;
    avgAgeDays: number;
    _ageSum: number;
  }>();

  for (const q of pendingQuotes) {
    const ageMs = now.getTime() - new Date(q.quoteDate).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const isExpired = q.validityDate ? new Date(q.validityDate).getTime() < now.getTime() : false;
    const cur = q.currency || 'USD';
    const value = decimalToNumber(q.price);

    let bucket: keyof typeof buckets;
    if (isExpired) bucket = 'expired';
    else if (ageDays <= 7) bucket = 'under7';
    else if (ageDays <= 14) bucket = 'under14';
    else if (ageDays <= 30) bucket = 'under30';
    else bucket = 'over30';

    buckets[bucket].count++;
    buckets[bucket].value[cur] = (buckets[bucket].value[cur] || 0) + value;

    expectedValue[cur] = (expectedValue[cur] || 0) + value;

    oldestList.push({
      id: q.id,
      quoteNo: q.quoteNo,
      customerName: q.customer?.companyName || '-',
      assignedUserName: q.assignedUser?.fullName || '-',
      quoteDate: q.quoteDate,
      validityDate: q.validityDate,
      ageDays,
      isExpired,
      price: value,
      currency: cur,
    });

    const u = byUserMap.get(q.assignedUserId) || {
      userId: q.assignedUserId,
      fullName: q.assignedUser?.fullName || `#${q.assignedUserId}`,
      count: 0,
      value: {},
      avgAgeDays: 0,
      _ageSum: 0,
    };
    u.count++;
    u.value[cur] = (u.value[cur] || 0) + value;
    u._ageSum += ageDays;
    byUserMap.set(q.assignedUserId, u);
  }

  const byUser = Array.from(byUserMap.values())
    .map((u) => {
      const { _ageSum, ...rest } = u;
      return { ...rest, avgAgeDays: u.count > 0 ? Math.round(_ageSum / u.count) : 0 };
    })
    .sort((a, b) => b.count - a.count);

  oldestList.sort((a, b) => b.ageDays - a.ageDays);
  const oldest = oldestList.slice(0, 15);

  res.json({
    success: true,
    data: {
      summary: {
        total: pendingQuotes.length,
        expectedValue,
        expired: buckets.expired.count,
        avgAgeDays:
          pendingQuotes.length > 0
            ? Math.round(
                pendingQuotes.reduce(
                  (sum, q) =>
                    sum +
                    Math.floor((now.getTime() - new Date(q.quoteDate).getTime()) / 86400000),
                  0,
                ) / pendingQuotes.length,
              )
            : 0,
      },
      ageBuckets: [
        { key: 'under7', ...buckets.under7 },
        { key: 'under14', ...buckets.under14 },
        { key: 'under30', ...buckets.under30 },
        { key: 'over30', ...buckets.over30 },
        { key: 'expired', ...buckets.expired },
      ],
      oldest,
      byUser,
    },
  });
}

// ============================================================================
// /reports/analytics/shipments
// Sevkiyat raporu — aktif/tamamlanan, durum, mod, ETA gecikme
// ============================================================================

export async function shipments(req: Request, res: Response) {
  const range = parseRange(req);
  const userIds = parseAssignedUserIds(req);
  const where: Prisma.ShipmentWhereInput = {
    isDeleted: false,
    createdAt: { gte: range.start, lte: range.end },
  };
  if (userIds) where.assignedUserId = { in: userIds };
  if (req.query.transportMode) where.transportMode = String(req.query.transportMode);

  const list = await prisma.shipment.findMany({
    where,
    include: {
      customer: { select: { id: true, companyName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  // Status dagilimi
  const statusMap = new Map<string, number>();
  for (const s of list) {
    const k = s.status || 'unknown';
    statusMap.set(k, (statusMap.get(k) || 0) + 1);
  }
  const statusDistribution = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Mod dagilimi
  const modeMap = new Map<string, number>();
  for (const s of list) {
    const k = s.transportMode || 'Belirtilmemis';
    modeMap.set(k, (modeMap.get(k) || 0) + 1);
  }
  const transportModes = Array.from(modeMap.entries())
    .map(([mode, count]) => ({ mode, count }))
    .sort((a, b) => b.count - a.count);

  // Aktif sevkiyatlar (status: booked, in_transit gibi — completed olmayan)
  const completedStatuses = new Set(['delivered', 'completed', 'cancelled']);
  const active = list.filter((s) => !completedStatuses.has((s.status || '').toLowerCase()));
  const completed = list.filter((s) => completedStatuses.has((s.status || '').toLowerCase()));

  // ETA gecikme tespiti
  type DelayItem = {
    id: number;
    shipmentNo: string;
    customerName: string;
    transportMode: string | null;
    origin: string | null;
    destination: string | null;
    eta: Date | null;
    delayDays: number;
    status: string;
  };
  const delayed: DelayItem[] = [];
  for (const s of active) {
    if (!s.eta) continue;
    const etaTime = new Date(s.eta).getTime();
    if (etaTime < now.getTime()) {
      const delayDays = Math.floor((now.getTime() - etaTime) / (1000 * 60 * 60 * 24));
      delayed.push({
        id: s.id,
        shipmentNo: s.shipmentNo,
        customerName: s.customer?.companyName || '-',
        transportMode: s.transportMode,
        origin: s.originCountry,
        destination: s.destinationCountry,
        eta: s.eta,
        delayDays,
        status: s.status,
      });
    }
  }
  delayed.sort((a, b) => b.delayDays - a.delayDays);

  // Yaklasan teslimatlar (gelecek 14 gun)
  const upcomingLimit = new Date(now.getTime() + 14 * 86400000);
  const upcoming = active
    .filter((s) => s.eta && new Date(s.eta) >= now && new Date(s.eta) <= upcomingLimit)
    .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime())
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      shipmentNo: s.shipmentNo,
      customerName: s.customer?.companyName || '-',
      transportMode: s.transportMode,
      origin: s.originCountry,
      destination: s.destinationCountry,
      eta: s.eta,
      status: s.status,
    }));

  // Aylik trend
  const buckets = buildMonthlyBuckets(range.start, range.end);
  const monthMap = new Map<string, number>();
  buckets.forEach((b) => monthMap.set(b, 0));
  for (const s of list) {
    const k = ymKey(new Date(s.createdAt));
    if (monthMap.has(k)) monthMap.set(k, (monthMap.get(k) || 0) + 1);
  }
  const monthlyTrend = buckets.map((m) => ({ month: m, count: monthMap.get(m) || 0 }));

  res.json({
    success: true,
    data: {
      summary: {
        total: list.length,
        active: active.length,
        completed: completed.length,
        delayed: delayed.length,
      },
      statusDistribution,
      transportModes,
      delayed: delayed.slice(0, 15),
      upcoming,
      monthlyTrend,
    },
  });
}

