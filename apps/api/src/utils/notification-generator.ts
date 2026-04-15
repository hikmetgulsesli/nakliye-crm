import { prisma } from '../config/database';

/**
 * Auto-generate notifications for various business conditions.
 * Designed to run periodically (every 60 minutes).
 */
export async function generateNotifications(): Promise<void> {
  const now = new Date();

  try {
    // 1. Customers not contacted for 14+ days
    await notifyUncontactedCustomers(now);

    // 2. Quotations pending for 7+ days
    await notifyPendingQuotations(now);

    // 3. Expired quotations (validityDate passed)
    await notifyExpiredQuotations(now);

    // 4. High-potential customers with no quote for 30+ days
    await notifyHighPotentialNoQuote(now);

    console.log(`[Notifications] Generated at ${now.toISOString()}`);
  } catch (error) {
    console.error('[Notifications] Error generating notifications:', error);
  }
}

// ---------- 1. 14+ gun aranmayan musteriler ----------

async function notifyUncontactedCustomers(now: Date) {
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      status: 'Aktif',
      OR: [
        { lastContactDate: { lt: fourteenDaysAgo } },
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
        title: 'Aranmayan Musteri',
        message: { contains: customer.companyName },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: customer.assignedUserId,
          type: 'warning',
          title: 'Aranmayan Musteri',
          message: `${customer.companyName} - 14+ gundur aranmadi`,
          link: `/customers/${customer.id}`,
        },
      });
    }
  }
}

// ---------- 2. 7+ gun bekleyen teklifler ----------

async function notifyPendingQuotations(now: Date) {
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const quotations = await prisma.quotation.findMany({
    where: {
      status: 'Bekliyor',
      createdAt: { lt: sevenDaysAgo },
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
          message: `${q.quoteNo} (${q.customer.companyName}) - 7+ gundur bekliyor`,
          link: `/quotations/${q.id}`,
        },
      });
    }
  }
}

// ---------- 3. Suresi dolmus teklifler ----------

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
        title: 'Suresi Dolmus Teklif',
        message: { contains: q.quoteNo },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: q.assignedUserId,
          type: 'error',
          title: 'Suresi Dolmus Teklif',
          message: `${q.quoteNo} (${q.customer.companyName}) - Gecerlilik suresi doldu`,
          link: `/quotations/${q.id}`,
        },
      });
    }
  }
}

// ---------- 4. Yuksek potansiyel + 30 gun teklif yok ----------

async function notifyHighPotentialNoQuote(now: Date) {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      potential: 'Yuksek',
      OR: [
        { lastQuoteDate: { lt: thirtyDaysAgo } },
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
        title: 'Yuksek Potansiyel - Teklif Yok',
        message: { contains: customer.companyName },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: customer.assignedUserId,
          type: 'warning',
          title: 'Yuksek Potansiyel - Teklif Yok',
          message: `${customer.companyName} - 30+ gundur teklif verilmedi`,
          link: `/customers/${customer.id}`,
        },
      });
    }
  }
}

// ---------- Scheduler ----------

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationScheduler(): void {
  console.log('[Notifications] Scheduler started - running every 60 minutes');

  // Run once immediately
  generateNotifications();

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
