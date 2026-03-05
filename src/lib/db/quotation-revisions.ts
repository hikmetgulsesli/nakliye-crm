import type { QuotationRevision, QuotationRevisionWithUser, RevisionChange } from '@/types';
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
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (revised_by) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_revisions_quotation ON quotation_revisions(quotation_id);
    CREATE INDEX IF NOT EXISTS idx_revisions_date ON quotation_revisions(revised_at);
  `);
}

export function createRevision(
  quotationId: string,
  revisionNo: number,
  changes: RevisionChange[],
  revisedBy: string
): QuotationRevision {
  const database = getDb();
  const id = crypto.randomUUID();
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
    JSON.stringify(changes),
    revisedBy,
    now
  );

  return {
    id,
    quotation_id: quotationId,
    revision_no: revisionNo,
    changed_fields: changes,
    revised_by: revisedBy,
    revised_at: now,
  };
}

export function getRevisionsByQuotationId(quotationId: string): QuotationRevisionWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      r.*,
      u.full_name as revised_by_name
    FROM quotation_revisions r
    LEFT JOIN users u ON r.revised_by = u.id
    WHERE r.quotation_id = ?
    ORDER BY r.revision_no DESC
  `);
  
  const rows = stmt.all(quotationId) as Record<string, unknown>[];
  return rows.map(mapRowToRevisionWithUser);
}

export function getRevisionById(id: string): QuotationRevision | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM quotation_revisions WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToRevision(row) : null;
}

export function getNextRevisionNumber(quotationId: string): number {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT MAX(revision_no) as max_revision 
    FROM quotation_revisions 
    WHERE quotation_id = ?
  `);
  const row = stmt.get(quotationId) as { max_revision: number | null } | undefined;
  return (row?.max_revision || 0) + 1;
}

export function computeChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): RevisionChange[] {
  const changes: RevisionChange[] = [];
  const fieldsToTrack = [
    'customer_id',
    'quote_date',
    'valid_until',
    'transport_mode',
    'service_type',
    'origin_country',
    'destination_country',
    'pol',
    'pod',
    'incoterm',
    'price',
    'currency',
    'price_note',
    'status',
    'loss_reason',
    'assigned_user_id',
  ];

  for (const field of fieldsToTrack) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    // Handle null/undefined comparison
    const oldNormalized = oldValue === undefined ? null : oldValue;
    const newNormalized = newValue === undefined ? null : newValue;

    if (JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized)) {
      changes.push({
        field,
        old_value: oldNormalized,
        new_value: newNormalized,
      });
    }
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