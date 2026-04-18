import { prisma } from '../config/database';
import { getSetting } from '../services/system-settings.service';

/**
 * Auto-generate notifications for various business conditions.
 * Designed to run periodically (every 60 minutes).
 */
export async function generateNotifications(): Promise<void> {
  const now = new Date();

  try {
    // Ayarlar kapaliysa hicbir sey yapma.
    const enabled = await getSetting<boolean>('notifications.enabled');
    if (enabled === false) {
      console.log('[Notifications] Scheduler ayardan kapatilmis, atlanti.');
      return;
    }

    const uncontactedDays = (await getSetting<number>('notifications.uncontacted_days')) ?? 14;
    const pendingDays = (await getSetting<number>('notifications.pending_quote_days')) ?? 7;
    const highPotentialDays = (await getSetting<number>('notifications.high_potential_days')) ?? 30;

    await notifyUncontactedCustomers(now, uncontactedDays);
    await notifyPendingQuotations(now, pendingDays);
    await notifyExpiredQuotations(now);
    await notifyHighPotentialNoQuote(now, highPotentialDays);
    await notifyTodaysFollowups(now);
    await notifyUpcomingBirthdays(now);

    console.log(`[Notifications] Generated at ${now.toISOString()}`);
  } catch (error) {
    console.error('[Notifications] Error generating notifications:', error);
  }
}

// ---------- 1. 14+ gün aranmayan müşteriler ----------

async function notifyUncontactedCustomers(now: Date, days: number) {
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - days);

  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      status: 'Aktif',
      OR: [
        { lastContactDate: { lt: threshold } },
        { lastContactDate: null },
      ],
    },
    select: { id: true, companyName: true, assignedUserId: true },
  });

  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const customer of customers) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: customer.assignedUserId,
        title: 'Aranmayan Müşteri',
        message: { contains: customer.companyName },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: customer.assignedUserId,
          type: 'warning',
          title: 'Aranmayan Müşteri',
          message: `${customer.companyName} - ${days}+ gundur aranmadi`,
          link: `/customers/${customer.id}`,
        },
      });
    }
  }
}

// ---------- 2. 7+ gün bekleyen teklifler ----------

async function notifyPendingQuotations(now: Date, days: number) {
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - days);

  const quotations = await prisma.quotation.findMany({
    where: {
      status: 'Bekliyor',
      createdAt: { lt: threshold },
      isDeleted: false,
    },
    select: {
      id: true,
      quoteNo: true,
      assignedUserId: true,
      customer: { select: { companyName: true } },
    },
  });

  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const q of quotations) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: q.assignedUserId,
        title: 'Bekleyen Teklif',
        message: { contains: q.quoteNo },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: q.assignedUserId,
          type: 'info',
          title: 'Bekleyen Teklif',
          message: `${q.quoteNo} (${q.customer.companyName}) - ${days}+ gundur bekliyor`,
          link: `/quotations/${q.id}`,
        },
      });
    }
  }
}

// ---------- 3. Süresi dolmus teklifler ----------

async function notifyExpiredQuotations(now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const quotations = await prisma.quotation.findMany({
    where: {
      status: 'Bekliyor',
      validityDate: { lt: today },
      isDeleted: false,
    },
    select: {
      id: true,
      quoteNo: true,
      assignedUserId: true,
      validityDate: true,
      customer: { select: { companyName: true } },
    },
  });

  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const q of quotations) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: q.assignedUserId,
        title: 'Süresi Dolmus Teklif',
        message: { contains: q.quoteNo },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: q.assignedUserId,
          type: 'error',
          title: 'Süresi Dolmus Teklif',
          message: `${q.quoteNo} (${q.customer.companyName}) - Geçerlilik süresi doldu`,
          link: `/quotations/${q.id}`,
        },
      });
    }
  }
}

// ---------- 4. Yüksek potansiyel + 30 gün teklif yok ----------

async function notifyHighPotentialNoQuote(now: Date, days: number) {
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - days);

  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      potential: 'Yüksek',
      OR: [
        { lastQuoteDate: { lt: threshold } },
        { lastQuoteDate: null },
      ],
    },
    select: { id: true, companyName: true, assignedUserId: true },
  });

  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const customer of customers) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: customer.assignedUserId,
        title: 'Yüksek Potansiyel - Teklif Yok',
        message: { contains: customer.companyName },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: customer.assignedUserId,
          type: 'warning',
          title: 'Yüksek Potansiyel - Teklif Yok',
          message: `${customer.companyName} - ${days}+ gundur teklif verilmedi`,
          link: `/customers/${customer.id}`,
        },
      });
    }
  }
}

// ---------- Scheduler ----------

// ---------- 6. Yaklasan dogum gunleri (3 gun kala) ----------

async function notifyUpcomingBirthdays(now: Date) {
  const contacts = await prisma.customerContact.findMany({
    where: { birthdate: { not: null } },
    include: { customer: { select: { id: true, companyName: true, assignedUserId: true } } },
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayAgo = new Date(today);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const c of contacts) {
    const b = c.birthdate!;
    const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    const target = thisYear < today
      ? new Date(now.getFullYear() + 1, b.getMonth(), b.getDate())
      : thisYear;
    const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);

    // 3 gun kala bildir (bir kere)
    if (diffDays !== 3) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: c.customer.assignedUserId,
        title: 'Doğum Günü Yaklaşıyor',
        message: { contains: `contact-${c.id}` },
        createdAt: { gte: oneDayAgo },
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId: c.customer.assignedUserId,
        type: 'info',
        title: 'Doğum Günü Yaklaşıyor',
        message: `${c.fullName} (${c.customer.companyName}) 3 gün içinde doğum günü [contact-${c.id}]`,
        link: `/musteriler/${c.customerId}`,
      },
    });
  }
}

// ---------- 5. Bugün planlanmıs follow-up'lar ----------

async function notifyTodaysFollowups(now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const followups = await prisma.activity.findMany({
    where: {
      isDeleted: false,
      nextActionDate: { gte: today, lt: tomorrow },
    },
    include: { customer: { select: { id: true, companyName: true } } },
  });

  for (const f of followups) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: f.createdById,
        title: 'Bugün Follow-up',
        message: { contains: `#${f.id}` },
        createdAt: { gte: today },
      },
    });
    if (existing) continue;
    await prisma.notification.create({
      data: {
        userId: f.createdById,
        type: 'info',
        title: 'Bugün Follow-up',
        message: `${f.customer?.companyName || 'Müşteri'} ile bugün görüşme planınız var [#${f.id}]`,
        link: `/musteriler/${f.customerId}`,
      },
    });
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(): void {
  console.log('[Notifications] Scheduler started - running every 60 minutes');

  // Run first check after 30 seconds (let DB connection stabilize)
  setTimeout(() => generateNotifications(), 30_000);

  // Then every 60 minutes
  schedulerInterval = setInterval(
    () => {
      generateNotifications();
    },
    60 * 60 * 1000 // 60 minutes
  );
}

export function stopNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Notifications] Scheduler stopped');
  }
}
