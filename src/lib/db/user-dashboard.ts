import type {
  UserDashboardMetrics,
  UpcomingFollowUp,
  RecentActivity,
} from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
  }
  return db;
}

export function getUserDashboardMetrics(userId: string): UserDashboardMetrics {
  const database = getDb();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Quotes this week (assigned to user)
  const quotesThisWeekStmt = database.prepare(`
    SELECT COUNT(*) as count FROM quotations
    WHERE assigned_user_id = ?
    AND quote_date >= ?
  `);
  const quotesThisWeek = (quotesThisWeekStmt.get(userId, startOfWeek.toISOString().split('T')[0]) as { count: number }).count;

  // Quotes this month (assigned to user)
  const quotesThisMonthStmt = database.prepare(`
    SELECT COUNT(*) as count FROM quotations
    WHERE assigned_user_id = ?
    AND quote_date >= ?
  `);
  const quotesThisMonth = (quotesThisMonthStmt.get(userId, startOfMonth.toISOString().split('T')[0]) as { count: number }).count;

  // Won quotes this month (assigned to user)
  const wonQuotesStmt = database.prepare(`
    SELECT COUNT(*) as count FROM quotations
    WHERE assigned_user_id = ?
    AND status = 'Kazanildi'
    AND quote_date >= ?
  `);
  const wonQuotesThisMonth = (wonQuotesStmt.get(userId, startOfMonth.toISOString().split('T')[0]) as { count: number }).count;

  // Total quotes this month for win rate calculation
  const totalQuotesThisMonth = quotesThisMonth;
  const winRateThisMonth = totalQuotesThisMonth > 0 
    ? Math.round((wonQuotesThisMonth / totalQuotesThisMonth) * 100) 
    : 0;

  // Customers contacted this month (activities created by user)
  const customersContactedStmt = database.prepare(`
    SELECT COUNT(DISTINCT customer_id) as count FROM activities
    WHERE created_by = ?
    AND activity_date >= ?
  `);
  const customersContactedThisMonth = (customersContactedStmt.get(userId, startOfMonth.toISOString().split('T')[0]) as { count: number }).count;

  // Pending quotes (assigned to user, status = Bekliyor)
  const pendingQuotesStmt = database.prepare(`
    SELECT COUNT(*) as count FROM quotations
    WHERE assigned_user_id = ?
    AND status = 'Bekliyor'
  `);
  const pendingQuotes = (pendingQuotesStmt.get(userId) as { count: number }).count;

  // Active customers assigned to user
  const activeCustomersStmt = database.prepare(`
    SELECT COUNT(*) as count FROM customers
    WHERE assigned_user_id = ?
    AND status = 'Aktif'
  `);
  const activeCustomersAssigned = (activeCustomersStmt.get(userId) as { count: number }).count;

  // Activities this week (created by user)
  const activitiesThisWeekStmt = database.prepare(`
    SELECT COUNT(*) as count FROM activities
    WHERE created_by = ?
    AND activity_date >= ?
  `);
  const activitiesThisWeek = (activitiesThisWeekStmt.get(userId, startOfWeek.toISOString().split('T')[0]) as { count: number }).count;

  return {
    quotesThisWeek,
    quotesThisMonth,
    wonQuotesThisMonth,
    winRateThisMonth,
    customersContactedThisMonth,
    pendingQuotes,
    activeCustomersAssigned,
    activitiesThisWeek,
  };
}

export function getUpcomingFollowUps(userId: string, limit = 5): UpcomingFollowUp[] {
  const database = getDb();
  const today = new Date().toISOString().split('T')[0];

  const stmt = database.prepare(`
    SELECT 
      a.id,
      a.customer_id,
      c.company_name as customer_name,
      a.next_action_date,
      a.notes,
      a.activity_date as last_contact_date
    FROM activities a
    JOIN customers c ON a.customer_id = c.id
    WHERE a.created_by = ?
    AND a.next_action_date >= ?
    AND a.next_action_date IS NOT NULL
    ORDER BY a.next_action_date ASC
    LIMIT ?
  `);

  const rows = stmt.all(userId, today, limit) as Array<{
    id: number;
    customer_id: number;
    customer_name: string;
    next_action_date: string;
    notes: string;
    last_contact_date: string;
  }>;

  return rows.map(row => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    customerName: row.customer_name,
    nextActionDate: row.next_action_date,
    notes: row.notes,
    lastContactDate: row.last_contact_date,
  }));
}

export function getRecentActivities(userId: string, limit = 10): RecentActivity[] {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      a.id,
      a.customer_id,
      c.company_name as customer_name,
      a.type,
      a.activity_date,
      a.outcome,
      a.notes,
      a.created_at
    FROM activities a
    JOIN customers c ON a.customer_id = c.id
    WHERE a.created_by = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(userId, limit) as Array<{
    id: number;
    customer_id: number;
    customer_name: string;
    type: string;
    activity_date: string;
    outcome: string | null;
    notes: string;
    created_at: string;
  }>;

  const typeLabels: Record<string, string> = {
    phone: 'Telefon Görüşmesi',
    email: 'E-posta',
    meeting: 'Yüz Yüze Görüşme',
    video: 'Video Görüşmesi',
  };

  const outcomeLabels: Record<string, string> = {
    positive: 'Olumlu',
    neutral: 'Nötr',
    negative: 'Olumsuz',
    quote_requested: 'Teklif İstendi',
  };

  return rows.map(row => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    customerName: row.customer_name,
    type: row.type,
    typeLabel: typeLabels[row.type] || row.type,
    activityDate: row.activity_date,
    outcome: row.outcome,
    outcomeLabel: row.outcome ? outcomeLabels[row.outcome] || row.outcome : null,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}