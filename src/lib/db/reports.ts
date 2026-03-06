import DatabaseConstructor from 'better-sqlite3';
import type {
  PeriodReportFilters,
  PeriodReportStats,
  PeriodReportRow,
  PerformanceReportRow,
  WonLostAnalysis,
  CountryVolumeReport,
  SavedReport,
  ReportType,
} from '@/types/index.js';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
  }
  return db;
}

// Period Quotation Report
export function getPeriodReportStats(filters: PeriodReportFilters): PeriodReportStats {
  const database = getDb();
  
  let whereClause = 'WHERE q.quote_date BETWEEN ? AND ?';
  const params: (string | number)[] = [filters.startDate, filters.endDate];
  
  if (filters.status) {
    whereClause += ' AND q.status = ?';
    params.push(filters.status);
  }
  if (filters.assignedUserId) {
    whereClause += ' AND q.assigned_user_id = ?';
    params.push(filters.assignedUserId);
  }
  if (filters.currency) {
    whereClause += ' AND q.currency = ?';
    params.push(filters.currency);
  }

  const stmt = database.prepare(`
    SELECT 
      COUNT(*) as totalQuotations,
      COALESCE(SUM(q.price), 0) as totalValue,
      SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END) as wonCount,
      COALESCE(SUM(CASE WHEN q.status = 'won' THEN q.price ELSE 0 END), 0) as wonValue,
      SUM(CASE WHEN q.status = 'lost' THEN 1 ELSE 0 END) as lostCount,
      COALESCE(SUM(CASE WHEN q.status = 'lost' THEN q.price ELSE 0 END), 0) as lostValue,
      SUM(CASE WHEN q.status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
      COALESCE(SUM(CASE WHEN q.status = 'pending' THEN q.price ELSE 0 END), 0) as pendingValue
    FROM quotations q
    ${whereClause}
  `);
  
  const row = stmt.get(...params) as {
    totalQuotations: number;
    totalValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
    pendingCount: number;
    pendingValue: number;
  };
  
  const totalDecided = row.wonCount + row.lostCount;
  const winRate = totalDecided > 0 ? (row.wonCount / totalDecided) * 100 : 0;
  
  return {
    totalQuotations: row.totalQuotations,
    totalValue: row.totalValue,
    wonCount: row.wonCount,
    wonValue: row.wonValue,
    lostCount: row.lostCount,
    lostValue: row.lostValue,
    pendingCount: row.pendingCount,
    pendingValue: row.pendingValue,
    winRate: Math.round(winRate * 100) / 100,
  };
}

export function getPeriodReportRows(filters: PeriodReportFilters): PeriodReportRow[] {
  const database = getDb();
  
  let whereClause = 'WHERE q.quote_date BETWEEN ? AND ?';
  const params: (string | number)[] = [filters.startDate, filters.endDate];
  
  if (filters.status) {
    whereClause += ' AND q.status = ?';
    params.push(filters.status);
  }
  if (filters.assignedUserId) {
    whereClause += ' AND q.assigned_user_id = ?';
    params.push(filters.assignedUserId);
  }
  if (filters.currency) {
    whereClause += ' AND q.currency = ?';
    params.push(filters.currency);
  }

  const stmt = database.prepare(`
    SELECT 
      q.id,
      q.quote_no,
      q.quote_date,
      c.company_name as customer_name,
      q.transport_mode,
      q.origin_country,
      q.destination_country,
      q.price,
      q.currency,
      q.status,
      q.loss_reason,
      u.full_name as assigned_user_name
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    LEFT JOIN users u ON q.assigned_user_id = u.id
    ${whereClause}
    ORDER BY q.quote_date DESC
  `);
  
  return stmt.all(...params) as PeriodReportRow[];
}

// Personnel Performance Report
export function getPersonnelPerformanceReport(
  startDate: string,
  endDate: string
): PerformanceReportRow[] {
  const database = getDb();
  
  const stmt = database.prepare(`
    SELECT 
      u.id as user_id,
      u.full_name as user_name,
      COUNT(q.id) as totalQuotations,
      COALESCE(SUM(q.price), 0) as totalValue,
      SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END) as wonCount,
      COALESCE(SUM(CASE WHEN q.status = 'won' THEN q.price ELSE 0 END), 0) as wonValue,
      SUM(CASE WHEN q.status = 'lost' THEN 1 ELSE 0 END) as lostCount,
      COALESCE(SUM(CASE WHEN q.status = 'lost' THEN q.price ELSE 0 END), 0) as lostValue
    FROM users u
    LEFT JOIN quotations q ON u.id = q.assigned_user_id 
      AND q.quote_date BETWEEN ? AND ?
    WHERE u.is_active = 1
    GROUP BY u.id, u.full_name
    ORDER BY totalValue DESC
  `);
  
  const rows = stmt.all(startDate, endDate) as {
    user_id: number;
    user_name: string;
    totalQuotations: number;
    totalValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    lostValue: number;
  }[];
  
  return rows.map(row => {
    const totalDecided = row.wonCount + row.lostCount;
    const winRate = totalDecided > 0 ? (row.wonCount / totalDecided) * 100 : 0;
    const avgQuoteValue = row.totalQuotations > 0 ? row.totalValue / row.totalQuotations : 0;
    
    return {
      ...row,
      pendingCount: row.totalQuotations - row.wonCount - row.lostCount,
      winRate: Math.round(winRate * 100) / 100,
      avgQuoteValue: Math.round(avgQuoteValue * 100) / 100,
    };
  });
}

// Won/Lost Analysis
export function getWonLostAnalysis(
  startDate: string,
  endDate: string,
  assignedUserId?: number
): WonLostAnalysis {
  const database = getDb();
  
  let whereClause = 'WHERE quote_date BETWEEN ? AND ?';
  const params: (string | number)[] = [startDate, endDate];
  
  if (assignedUserId) {
    whereClause += ' AND assigned_user_id = ?';
    params.push(assignedUserId);
  }

  // Overall stats
  const statsStmt = database.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM quotations
    ${whereClause}
  `);
  
  const stats = statsStmt.get(...params) as {
    total: number;
    won: number;
    lost: number;
    pending: number;
  };
  
  // By loss reason
  const reasonStmt = database.prepare(`
    SELECT 
      loss_reason as reason,
      COUNT(*) as count
    FROM quotations
    ${whereClause}
    AND status = 'lost'
    AND loss_reason IS NOT NULL
    GROUP BY loss_reason
    ORDER BY count DESC
  `);
  
  const reasonRows = reasonStmt.all(...params) as { reason: string; count: number }[];
  const totalLost = stats.lost || 1;
  
  const byLossReason = reasonRows.map(row => ({
    reason: row.reason,
    count: row.count,
    percentage: Math.round((row.count / totalLost) * 100 * 100) / 100,
  }));
  
  // By month
  const monthStmt = database.prepare(`
    SELECT 
      strftime('%Y-%m', quote_date) as month,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM quotations
    ${whereClause}
    GROUP BY strftime('%Y-%m', quote_date)
    ORDER BY month
  `);
  
  const byMonth = monthStmt.all(...params) as {
    month: string;
    won: number;
    lost: number;
    pending: number;
  }[];
  
  const totalDecided = stats.won + stats.lost;
  
  return {
    totalQuotes: stats.total,
    wonCount: stats.won,
    lostCount: stats.lost,
    wonPercentage: totalDecided > 0 ? Math.round((stats.won / totalDecided) * 100 * 100) / 100 : 0,
    lostPercentage: totalDecided > 0 ? Math.round((stats.lost / totalDecided) * 100 * 100) / 100 : 0,
    byLossReason,
    byMonth,
  };
}

// Country/Mode Volume Report
export function getCountryVolumeReport(
  startDate: string,
  endDate: string
): CountryVolumeReport {
  const database = getDb();
  
  const params = [startDate, endDate];
  
  // Origin countries
  const originStmt = database.prepare(`
    SELECT 
      origin_country as country,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
    AND origin_country IS NOT NULL
    GROUP BY origin_country
    ORDER BY count DESC
    LIMIT 10
  `);
  
  const originRows = originStmt.all(...params) as { country: string; count: number }[];
  const totalOrigin = originRows.reduce((sum, row) => sum + row.count, 0) || 1;
  
  // Destination countries
  const destStmt = database.prepare(`
    SELECT 
      destination_country as country,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
    AND destination_country IS NOT NULL
    GROUP BY destination_country
    ORDER BY count DESC
    LIMIT 10
  `);
  
  const destRows = destStmt.all(...params) as { country: string; count: number }[];
  const totalDest = destRows.reduce((sum, row) => sum + row.count, 0) || 1;
  
  // Transport mode distribution
  const modeStmt = database.prepare(`
    SELECT 
      transport_mode as mode,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
    AND transport_mode IS NOT NULL
    GROUP BY transport_mode
    ORDER BY count DESC
  `);
  
  const modeRows = modeStmt.all(...params) as { mode: string; count: number }[];
  const totalMode = modeRows.reduce((sum, row) => sum + row.count, 0) || 1;
  
  // Top combinations
  const comboStmt = database.prepare(`
    SELECT 
      origin_country as origin,
      destination_country as destination,
      transport_mode as mode,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
    AND origin_country IS NOT NULL 
    AND destination_country IS NOT NULL
    AND transport_mode IS NOT NULL
    GROUP BY origin_country, destination_country, transport_mode
    ORDER BY count DESC
    LIMIT 20
  `);
  
  const combinations = comboStmt.all(...params) as {
    origin: string;
    destination: string;
    mode: string;
    count: number;
  }[];
  
  return {
    originCountries: originRows.map(row => ({
      country: row.country,
      count: row.count,
      percentage: Math.round((row.count / totalOrigin) * 100 * 100) / 100,
    })),
    destinationCountries: destRows.map(row => ({
      country: row.country,
      count: row.count,
      percentage: Math.round((row.count / totalDest) * 100 * 100) / 100,
    })),
    modeDistribution: modeRows.map(row => ({
      mode: row.mode,
      count: row.count,
      percentage: Math.round((row.count / totalMode) * 100 * 100) / 100,
    })),
    combinations,
  };
}

// Saved Report Parameters
export function saveReportParams(
  userId: number,
  reportType: ReportType,
  name: string,
  params: Record<string, unknown>
): SavedReport {
  const database = getDb();
  
  // Initialize table if needed
  initializeReportsTable();
  
  const stmt = database.prepare(`
    INSERT INTO saved_reports (user_id, report_type, name, params, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  const result = stmt.run(userId, reportType, name, JSON.stringify(params));
  
  return {
    id: Number(result.lastInsertRowid),
    user_id: userId,
    report_type: reportType,
    name,
    params,
    created_at: new Date().toISOString(),
  };
}

export function getSavedReports(userId: number, reportType?: ReportType): SavedReport[] {
  const database = getDb();
  
  // Initialize table if needed
  initializeReportsTable();
  
  let query = 'SELECT * FROM saved_reports WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  
  if (reportType) {
    query += ' AND report_type = ?';
    params.push(reportType);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = database.prepare(query);
  const rows = stmt.all(...params) as {
    id: number;
    user_id: number;
    report_type: ReportType;
    name: string;
    params: string;
    created_at: string;
  }[];
  
  return rows.map(row => ({
    ...row,
    params: JSON.parse(row.params),
  }));
}

export function deleteSavedReport(id: number, userId: number): boolean {
  const database = getDb();
  
  const stmt = database.prepare(`
    DELETE FROM saved_reports 
    WHERE id = ? AND user_id = ?
  `);
  
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// Admin Dashboard Functions
export async function getAdminDashboardMetrics(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      COUNT(*) as totalQuotations,
      COALESCE(SUM(price), 0) as totalValue,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wonCount,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lostCount,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
  `);

  return stmt.get(startDate, endDate) as {
    totalQuotations: number;
    totalValue: number;
    wonCount: number;
    lostCount: number;
    pendingCount: number;
  };
}

export async function getAdminPersonnelPerformance(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      u.id,
      u.full_name as name,
      COUNT(q.id) as quotations,
      COALESCE(SUM(q.price), 0) as value,
      SUM(CASE WHEN q.status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN q.status = 'lost' THEN 1 ELSE 0 END) as lost
    FROM users u
    LEFT JOIN quotations q ON u.id = q.assigned_user_id 
      AND q.quote_date BETWEEN ? AND ?
    WHERE u.is_active = 1
    GROUP BY u.id, u.full_name
    ORDER BY quotations DESC
  `);

  return stmt.all(startDate, endDate) as {
    id: number;
    name: string;
    quotations: number;
    value: number;
    won: number;
    lost: number;
  }[];
}

export async function getAdminOriginCountries(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      origin_country as country,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
      AND origin_country IS NOT NULL
    GROUP BY origin_country
    ORDER BY count DESC
    LIMIT 10
  `);

  return stmt.all(startDate, endDate) as { country: string; count: number }[];
}

export async function getAdminDestinationCountries(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      destination_country as country,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
      AND destination_country IS NOT NULL
    GROUP BY destination_country
    ORDER BY count DESC
    LIMIT 10
  `);

  return stmt.all(startDate, endDate) as { country: string; count: number }[];
}

export async function getAdminModeDistribution(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      transport_mode as mode,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
      AND transport_mode IS NOT NULL
    GROUP BY transport_mode
    ORDER BY count DESC
  `);

  return stmt.all(startDate, endDate) as { mode: string; count: number }[];
}

export async function getAdminLossReasons(startDate: string, endDate: string) {
  const database = getDb();

  const stmt = database.prepare(`
    SELECT 
      loss_reason as reason,
      COUNT(*) as count
    FROM quotations
    WHERE quote_date BETWEEN ? AND ?
      AND status = 'lost'
      AND loss_reason IS NOT NULL
    GROUP BY loss_reason
    ORDER BY count DESC
  `);

  const rows = stmt.all(startDate, endDate) as { reason: string; count: number }[];
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;

  return rows.map(row => ({
    reason: row.reason,
    count: row.count,
    percentage: Math.round((row.count / total) * 100 * 100) / 100,
  }));
}

// Initialize saved_reports table
export function initializeReportsTable(): void {
  const database = getDb();
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS saved_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      name TEXT NOT NULL,
      params TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_reports_user 
    ON saved_reports(user_id)
  `);
  
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_reports_type 
    ON saved_reports(report_type)
  `);
}
