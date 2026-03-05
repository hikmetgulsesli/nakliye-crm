import type { QuotationRevision, RevisionChange, QuotationRevisionWithUser } from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeRevisionsTable();
  }
  return db;
}

function initializeRevisionsTable() {
  const database = db!;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS quotation_revisions (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      revision_no INTEGER NOT NULL,
      changed_fields TEXT NOT NULL,
      revised_by TEXT NOT NULL,
      revised_at TEXT NOT NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (revised_by) REFERENCES users(id)
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_quotation_revisions_quotation ON quotation_revisions(quotation_id);
    CREATE INDEX IF NOT EXISTS idx_quotation_revisions_revised_at ON quotation_revisions(revised_at);
  `);
}

/**
 * Get the next revision number for a quotation
 */
export function getNextRevisionNumber(quotationId: string): number {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT MAX(revision_no) as max_rev 
    FROM quotation_revisions 
    WHERE quotation_id = ?
  `);
  const row = stmt.get(quotationId) as { max_rev: number | null } | undefined;
  return (row?.max_rev ?? 0) + 1;
}

/**
 * Create a revision record
 */
export function createRevision(
  quotationId: string,
  changedFields: RevisionChange[],
  revisedBy: string
): QuotationRevision {
  const database = getDb();
  const id = crypto.randomUUID();
  const revisionNo = getNextRevisionNumber(quotationId);
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO quotation_revisions (
      id, quotation_id, revision_no, changed_fields, revised_by, revised_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    quotationId,
    revisionNo,
    JSON.stringify(changedFields),
    revisedBy,
    now
  );

  return {
    id,
    quotation_id: quotationId,
    revision_no: revisionNo,
    changed_fields: changedFields,
    revised_by: revisedBy,
    revised_at: now,
  };
}

/**
 * Get all revisions for a quotation
 */
export function getRevisionsByQuotationId(quotationId: string): QuotationRevisionWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      r.*,
      u.full_name as revised_by_name
    FROM quotation_revisions r
    LEFT JOIN users u ON r.revised_by = u.id
    WHERE r.quotation_id = ?
    ORDER BY r.revision_no ASC
  `);
  const rows = stmt.all(quotationId) as Record<string, unknown>[];
  return rows.map(mapRowToRevisionWithUser);
}

/**
 * Get a single revision by ID
 */
export function getRevisionById(id: string): QuotationRevision | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM quotation_revisions WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToRevision(row) : null;
}

/**
 * Delete all revisions for a quotation (useful for cleanup)
 */
export function deleteRevisionsByQuotationId(quotationId: string): number {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM quotation_revisions WHERE quotation_id = ?');
  const result = stmt.run(quotationId);
  return result.changes;
}

/**
 * Calculate field-level differences between old and new values
 */
export function calculateDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): RevisionChange[] {
  const changes: RevisionChange[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    changes.push({
      field: key,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
    });
  }

  return changes;
}

function mapRowToRevision(row: Record<string, unknown>): QuotationRevision {
  return {
    id: row.id as string,
    quotation_id: row.quotation_id as string,
    revision_no: row.revision_no as number,
    changed_fields: JSON.parse(row.changed_fields as string),
    revised_by: row.revised_by as string,
    revised_at: row.revised_at as string,
  };
}

function mapRowToRevisionWithUser(row: Record<string, unknown>): QuotationRevisionWithUser {
  const revision = mapRowToRevision(row);
  return {
    ...revision,
    revised_by_user: {
      id: revision.revised_by,
      full_name: row.revised_by_name as string,
    },
  };
}
