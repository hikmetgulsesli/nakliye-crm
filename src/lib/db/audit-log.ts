import DatabaseConstructor from 'better-sqlite3';
import type { AuditLog, CreateAuditLogInput, AuditLogWithUser } from '@/types/index.js';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeAuditLogTable();
  }
  return db;
}

function initializeAuditLogTable() {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changes TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_type, record_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
  `);
}

export function createAuditLog(input: CreateAuditLogInput): AuditLog {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO audit_log (
      id, user_id, record_type, record_id, action,
      changes, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.user_id,
    input.record_type,
    input.record_id,
    input.action,
    input.changes ? JSON.stringify(input.changes) : null,
    input.metadata ? JSON.stringify(input.metadata) : null,
    now
  );

  return {
    id,
    user_id: input.user_id,
    record_type: input.record_type,
    record_id: input.record_id,
    action: input.action,
    changes: input.changes ?? null,
    metadata: input.metadata ?? null,
    created_at: now,
  };
}

export function getAuditLogsByRecord(recordType: string, recordId: string): AuditLogWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      al.*,
      u.full_name as user_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.record_type = ? AND al.record_id = ?
    ORDER BY al.created_at DESC
  `);
  const rows = stmt.all(recordType, recordId) as Record<string, unknown>[];
  return rows.map(mapRowToAuditLogWithUser);
}

export function getAuditLogs(options: {
  limit?: number;
  record_type?: string;
  record_id?: string;
  customer_id?: string;
} = {}): AuditLogWithUser[] {
  const database = getDb();
  const { limit = 50, record_type, record_id, customer_id } = options;
  
  let query = `
    SELECT 
      al.*,
      u.full_name as user_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  
  if (record_type) {
    query += ` AND al.record_type = ?`;
    params.push(record_type);
  }
  
  if (record_id) {
    query += ` AND al.record_id = ?`;
    params.push(record_id);
  }
  
  if (customer_id) {
    query += ` AND (al.metadata LIKE ? OR al.record_id = ?)`;
    params.push(`%"customer_id":"${customer_id}"%`, customer_id);
  }
  
  query += ` ORDER BY al.created_at DESC LIMIT ?`;
  params.push(limit);
  
  const stmt = database.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToAuditLogWithUser);
}

export function getAuditLogsByCustomer(customerId: string): AuditLogWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      al.*,
      u.full_name as user_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.record_id = ? 
       OR al.metadata LIKE ?
       OR al.metadata LIKE ?
       OR al.metadata LIKE ?
    ORDER BY al.created_at DESC
  `);
  const rows = stmt.all(
    customerId,
    `%"customer_id":"${customerId}"%`,
    `%"customer_id": "${customerId}"%`,
    `%"id":"${customerId}"%`
  ) as Record<string, unknown>[];
  return rows.map(mapRowToAuditLogWithUser);
}

export function getRecentAuditLogs(limit: number = 50): AuditLogWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      al.*,
      u.full_name as user_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit) as Record<string, unknown>[];
  return rows.map(mapRowToAuditLogWithUser);
}

export function buildChangesObject(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }
  
  return changes;
}

function mapRowToAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    record_type: row.record_type as string,
    record_id: row.record_id as string,
    action: row.action as string,
    changes: row.changes ? JSON.parse(row.changes as string) : null,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
    created_at: row.created_at as string,
  };
}

function mapRowToAuditLogWithUser(row: Record<string, unknown>): AuditLogWithUser {
  const log = mapRowToAuditLog(row);
  return {
    ...log,
    user: {
      id: log.user_id,
      full_name: row.user_name as string,
    },
  };
}
