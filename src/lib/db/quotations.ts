import type { 
  Quotation, 
  CreateQuotationInput, 
  UpdateQuotationInput, 
  QuotationFilters,
  QuotationWithCustomer,
  Currency,
  LossReason
} from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeQuotationsTable();
  }
  return db;
}

function initializeQuotationsTable() {
  const database = db!;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quote_no TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      quote_date TEXT NOT NULL,
      validity_date TEXT,
      transport_mode TEXT NOT NULL,
      service_type TEXT NOT NULL,
      origin_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      pol TEXT,
      pod TEXT,
      incoterm TEXT NOT NULL,
      price REAL,
      currency TEXT,
      price_note TEXT,
      status TEXT NOT NULL DEFAULT 'Bekliyor',
      loss_reason TEXT,
      assigned_user_id TEXT NOT NULL,
      revision_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_quotations_quote_no ON quotations(quote_no);
    CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_assigned ON quotations(assigned_user_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quote_date);
    CREATE INDEX IF NOT EXISTS idx_quotations_deleted ON quotations(deleted_at);
  `);
}

/**
 * Generate next quote number in format TKF-YYYY-XXXX
 * Sequential per year, starts at 0001
 */
export function generateQuoteNumber(): string {
  const database = getDb();
  const year = new Date().getFullYear();
  
  // Get the highest quote number for current year
  const stmt = database.prepare(`
    SELECT quote_no FROM quotations 
    WHERE quote_no LIKE ?
    ORDER BY quote_no DESC 
    LIMIT 1
  `);
  
  const prefix = `TKF-${year}-`;
  const row = stmt.get(`${prefix}%`) as { quote_no: string } | undefined;
  
  let nextNum = 1;
  if (row) {
    // Extract the number from TKF-YYYY-XXXX
    const match = row.quote_no.match(/TKF-\d{4}-(\d{4})/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export function createQuotation(input: CreateQuotationInput, createdBy: string): Quotation {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const quoteNo = generateQuoteNumber();

  const stmt = database.prepare(`
    INSERT INTO quotations (
      id, quote_no, customer_id, quote_date, validity_date,
      transport_mode, service_type, origin_country, destination_country,
      pol, pod, incoterm, price, currency, price_note,
      status, loss_reason, assigned_user_id, revision_count,
      created_by, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    quoteNo,
    input.customer_id,
    input.quote_date,
    input.validity_date || null,
    input.transport_mode,
    input.service_type,
    input.origin_country,
    input.destination_country,
    input.pol || null,
    input.pod || null,
    input.incoterm,
    input.price || null,
    input.currency || null,
    input.price_note || null,
    input.status || 'Bekliyor',
    input.loss_reason || null,
    input.assigned_user_id,
    0, // revision_count starts at 0
    createdBy,
    now,
    now,
    null // deleted_at
  );

  return {
    id,
    quote_no: quoteNo,
    customer_id: input.customer_id,
    quote_date: input.quote_date,
    validity_date: input.validity_date || null,
    transport_mode: input.transport_mode,
    service_type: input.service_type,
    origin_country: input.origin_country,
    destination_country: input.destination_country,
    pol: input.pol || null,
    pod: input.pod || null,
    incoterm: input.incoterm,
    price: input.price || null,
    currency: input.currency || null,
    price_note: input.price_note || null,
    status: input.status || 'Bekliyor',
    loss_reason: input.loss_reason || null,
    assigned_user_id: input.assigned_user_id,
    revision_count: 0,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export function getQuotationById(id: string, includeDeleted = false): Quotation | null {
  const database = getDb();
  let query = 'SELECT * FROM quotations WHERE id = ?';
  if (!includeDeleted) {
    query += ' AND deleted_at IS NULL';
  }
  const stmt = database.prepare(query);
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToQuotation(row) : null;
}

export function getQuotationByIdWithCustomer(id: string, includeDeleted = false): QuotationWithCustomer | null {
  const database = getDb();
  let query = `
    SELECT 
      q.*,
      c.company_name as customer_company_name,
      c.contact_name as customer_contact_name,
      au.full_name as assigned_user_name,
      cb.full_name as created_by_name
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    LEFT JOIN users au ON q.assigned_user_id = au.id
    LEFT JOIN users cb ON q.created_by = cb.id
    WHERE q.id = ?
  `;
  if (!includeDeleted) {
    query += ' AND q.deleted_at IS NULL';
  }
  const stmt = database.prepare(query);
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToQuotationWithCustomer(row) : null;
}

export function getQuotations(filters: QuotationFilters = {}): QuotationWithCustomer[] {
  const database = getDb();
  const conditions: string[] = [];
  const values: (string | number | null)[] = [];

  // Base query
  let query = `
    SELECT 
      q.*,
      c.company_name as customer_company_name,
      c.contact_name as customer_contact_name,
      au.full_name as assigned_user_name,
      cb.full_name as created_by_name
    FROM quotations q
    LEFT JOIN customers c ON q.customer_id = c.id
    LEFT JOIN users au ON q.assigned_user_id = au.id
    LEFT JOIN users cb ON q.created_by = cb.id
  `;

  // Soft delete filter
  if (!filters.include_deleted) {
    conditions.push('q.deleted_at IS NULL');
  }

  // Status filter
  if (filters.status) {
    conditions.push('q.status = ?');
    values.push(filters.status);
  }

  // Customer filter
  if (filters.customer_id) {
    conditions.push('q.customer_id = ?');
    values.push(filters.customer_id);
  }

  // Assigned user filter
  if (filters.assigned_user_id) {
    conditions.push('q.assigned_user_id = ?');
    values.push(filters.assigned_user_id);
  }

  // Date range filters
  if (filters.date_from) {
    conditions.push('q.quote_date >= ?');
    values.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push('q.quote_date <= ?');
    values.push(filters.date_to);
  }

  // Search by quote number
  if (filters.search) {
    conditions.push('(q.quote_no LIKE ? OR c.company_name LIKE ?)');
    const searchPattern = `%${filters.search}%`;
    values.push(searchPattern, searchPattern);
  }

  // Add WHERE clause if there are conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Order by date desc
  query += ' ORDER BY q.quote_date DESC, q.created_at DESC';

  const stmt = database.prepare(query);
  const rows = stmt.all(...values) as Record<string, unknown>[];
  return rows.map(mapRowToQuotationWithCustomer);
}

export function updateQuotation(id: string, input: UpdateQuotationInput): Quotation | null {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.customer_id !== undefined) {
    sets.push('customer_id = ?');
    values.push(input.customer_id);
  }
  if (input.quote_date !== undefined) {
    sets.push('quote_date = ?');
    values.push(input.quote_date);
  }
  if (input.validity_date !== undefined) {
    sets.push('validity_date = ?');
    values.push(input.validity_date || null);
  }
  if (input.transport_mode !== undefined) {
    sets.push('transport_mode = ?');
    values.push(input.transport_mode);
  }
  if (input.service_type !== undefined) {
    sets.push('service_type = ?');
    values.push(input.service_type);
  }
  if (input.origin_country !== undefined) {
    sets.push('origin_country = ?');
    values.push(input.origin_country);
  }
  if (input.destination_country !== undefined) {
    sets.push('destination_country = ?');
    values.push(input.destination_country);
  }
  if (input.pol !== undefined) {
    sets.push('pol = ?');
    values.push(input.pol || null);
  }
  if (input.pod !== undefined) {
    sets.push('pod = ?');
    values.push(input.pod || null);
  }
  if (input.incoterm !== undefined) {
    sets.push('incoterm = ?');
    values.push(input.incoterm);
  }
  if (input.price !== undefined) {
    sets.push('price = ?');
    values.push(input.price ?? null);
  }
  if (input.currency !== undefined) {
    sets.push('currency = ?');
    values.push(input.currency || null);
  }
  if (input.price_note !== undefined) {
    sets.push('price_note = ?');
    values.push(input.price_note || null);
  }
  if (input.status !== undefined) {
    sets.push('status = ?');
    values.push(input.status);
  }
  if (input.loss_reason !== undefined) {
    sets.push('loss_reason = ?');
    values.push(input.loss_reason || null);
  }
  if (input.assigned_user_id !== undefined) {
    sets.push('assigned_user_id = ?');
    values.push(input.assigned_user_id);
  }

  if (sets.length === 0) return getQuotationById(id);

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = database.prepare(`UPDATE quotations SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`);
  stmt.run(...values);

  return getQuotationById(id);
}

/**
 * Increment revision count for a quotation
 */
export function incrementRevisionCount(id: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE quotations 
    SET revision_count = revision_count + 1, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `);
  stmt.run(new Date().toISOString(), id);
}

/**
 * Soft delete a quotation
 */
export function softDeleteQuotation(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE quotations 
    SET deleted_at = ?, updated_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `);
  const now = new Date().toISOString();
  const result = stmt.run(now, now, id);
  return result.changes > 0;
}

/**
 * Restore a soft-deleted quotation
 */
export function restoreQuotation(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE quotations 
    SET deleted_at = NULL, updated_at = ?
    WHERE id = ? AND deleted_at IS NOT NULL
  `);
  const result = stmt.run(new Date().toISOString(), id);
  return result.changes > 0;
}

/**
 * Hard delete a quotation (use with caution)
 */
export function deleteQuotation(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM quotations WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

function mapRowToQuotation(row: Record<string, unknown>): Quotation {
  return {
    id: row.id as string,
    quote_no: row.quote_no as string,
    customer_id: row.customer_id as string,
    quote_date: row.quote_date as string,
    validity_date: row.validity_date as string | null,
    transport_mode: row.transport_mode as string,
    service_type: row.service_type as string,
    origin_country: row.origin_country as string,
    destination_country: row.destination_country as string,
    pol: row.pol as string | null,
    pod: row.pod as string | null,
    incoterm: row.incoterm as string,
    price: row.price as number | null,
    currency: row.currency as Currency | null,
    price_note: row.price_note as string | null,
    status: row.status as Quotation['status'],
    loss_reason: row.loss_reason as LossReason | null,
    assigned_user_id: row.assigned_user_id as string,
    revision_count: row.revision_count as number,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
  };
}

function mapRowToQuotationWithCustomer(row: Record<string, unknown>): QuotationWithCustomer {
  const quotation = mapRowToQuotation(row);
  return {
    ...quotation,
    customer: {
      id: quotation.customer_id,
      company_name: row.customer_company_name as string,
      contact_name: row.customer_contact_name as string,
    },
    assigned_user: {
      id: quotation.assigned_user_id,
      full_name: row.assigned_user_name as string,
    },
    created_by_user: {
      id: quotation.created_by,
      full_name: row.created_by_name as string,
    },
  };
}
