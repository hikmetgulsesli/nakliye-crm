import type { Alert, AlertWithDetails, AlertType, AlertStatus, AlertCounts, AlertFilter } from '@/types/index.js';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeAlertsTable();
  }
  return db;
}

function initializeAlertsTable() {
  const database = db!;
  database.exec(\`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, entity_name TEXT NOT NULL,
      severity TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', assigned_user_id TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id), FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )
  \`);
  database.exec(\`
    CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_assigned ON alerts(assigned_user_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_type, entity_id);
  \`);
}

export function createAlert(type: AlertType, title: string, description: string, entityType: 'customer' | 'quotation', entityId: string, entityName: string, severity: 'low' | 'medium' | 'high', assignedUserId: string | null = null): Alert {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stmt = database.prepare(\`INSERT INTO alerts (id, type, title, description, entity_type, entity_id, entity_name, severity, status, assigned_user_id, created_at, updated_at, reviewed_at, reviewed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`);
  stmt.run(id, type, title, description, entityType, entityId, entityName, severity, 'active', assignedUserId, now, now, null, null);
  return { id, type, title, description, entity_type: entityType, entity_id: entityId, entity_name: entityName, severity, status: 'active', assigned_user_id: assignedUserId, created_at: now, updated_at: now, reviewed_at: null, reviewed_by: null };
}

export function getAlertById(id: string): Alert | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM alerts WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToAlert(row) : null;
}

export function getAlerts(filter?: AlertFilter): AlertWithDetails[] {
  const database = getDb();
  let query = \`SELECT a.*, au.full_name as assigned_user_name, ru.full_name as reviewed_by_name FROM alerts a LEFT JOIN users au ON a.assigned_user_id = au.id LEFT JOIN users ru ON a.reviewed_by = ru.id WHERE 1=1\`;
  const params: (string | null)[] = [];
  if (filter?.type) { query += ' AND a.type = ?'; params.push(filter.type); }
  if (filter?.status) { query += ' AND a.status = ?'; params.push(filter.status); }
  if (filter?.severity) { query += ' AND a.severity = ?'; params.push(filter.severity); }
  if (filter?.assigned_user_id) { query += ' AND (a.assigned_user_id = ? OR a.assigned_user_id IS NULL)'; params.push(filter.assigned_user_id); }
  query += ' ORDER BY a.created_at DESC';
  const stmt = database.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToAlertWithDetails);
}

export function getAlertCounts(): AlertCounts {
  const database = getDb();
  const types: AlertType[] = ['no_contact_14d', 'pending_quote_7d', 'expired_quote', 'high_potential_no_quote_30d'];
  const counts: Partial<AlertCounts> = {};
  let total = 0;
  for (const type of types) {
    const stmt = database.prepare('SELECT COUNT(*) as count FROM alerts WHERE type = ? AND status = \'active\'');
    const result = stmt.get(type) as { count: number };
    counts[type] = result.count;
    total += result.count;
  }
  counts.total = total;
  return counts as AlertCounts;
}

export function markAlertAsReviewed(id: string, reviewedBy: string): Alert | null {
  const database = getDb();
  const now = new Date().toISOString();
  const stmt = database.prepare('UPDATE alerts SET status = \'reviewed\', reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?');
  stmt.run(now, reviewedBy, now, id);
  return getAlertById(id);
}

export function dismissAlert(id: string): Alert | null {
  const database = getDb();
  const now = new Date().toISOString();
  const stmt = database.prepare('UPDATE alerts SET status = \'dismissed\', updated_at = ? WHERE id = ?');
  stmt.run(now, id);
  return getAlertById(id);
}

function mapRowToAlert(row: Record<string, unknown>): Alert {
  return { id: row.id as string, type: row.type as AlertType, title: row.title as string, description: row.description as string, entity_type: row.entity_type as 'customer' | 'quotation', entity_id: row.entity_id as string, entity_name: row.entity_name as string, severity: row.severity as 'low' | 'medium' | 'high', status: row.status as AlertStatus, assigned_user_id: row.assigned_user_id as string | null, created_at: row.created_at as string, updated_at: row.updated_at as string, reviewed_at: row.reviewed_at as string | null, reviewed_by: row.reviewed_by as string | null };
}

function mapRowToAlertWithDetails(row: Record<string, unknown>): AlertWithDetails {
  const alert = mapRowToAlert(row);
  return { ...alert, assigned_user_name: row.assigned_user_name as string | null, reviewed_by_name: row.reviewed_by_name as string | null };
}
