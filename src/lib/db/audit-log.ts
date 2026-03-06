import DatabaseConstructor from 'better-sqlite3';
import type { AuditLog, CreateAuditLogInput, AuditLogWithUser, AuditAction, AuditRecordType } from '@/types/index.js';

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
    changes: input.changes ? JSON.stringify(input.changes) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
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

function mapRowToAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    record_type: row.record_type as AuditRecordType,
    record_id: row.record_id as string,
    action: row.action as AuditAction,
    changes: row.changes ? JSON.parse(row.changes as string) : null,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
    created_at: row.created_at as string,
  };
}

function mapRowToAuditLogWithUser(row: Record<string, unknown>): AuditLogWithUser {
  const log = mapRowToAuditLog(row);
  return {
    ...log,
    user_name: row.user_name as string,
  };
}
