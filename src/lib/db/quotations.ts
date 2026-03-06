import type { Quotation, CreateQuotationInput, UpdateQuotationInput, QuotationWithCustomer, QuotationFilters } from '@/types';
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
      quote_no TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      quote_date TEXT NOT NULL,
      valid_until TEXT,
      transport_mode TEXT NOT NULL,
      service_type TEXT NOT NULL,
      origin_country TEXT NOT NULL,
      destination_country TEXT NOT NULL,
      pol TEXT,
      pod TEXT,
      incoterm TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
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

  // Create indexes for common queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_assigned ON quotations(assigned_user_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quote_date);
    CREATE INDEX IF NOT EXISTS idx_quotations_deleted ON quotations(deleted_at);
  `);
}

function generateQuoteNo(): string {
  const database = getDb();
  const year = new Date().getFullYear();
  
  // Get the highest sequence number for this year
  const stmt = database.prepare(`
    SELECT quote_no FROM quotations 
    WHERE quote_no LIKE ? 
    ORDER BY quote_no DESC 
    LIMIT 1
  `);
  
  const prefix = `TKF-${year}-`;
  const row = stmt.get(`${prefix}%`) as { quote_no: string } | undefined;
  
  let sequence = 1;
  if (row) {
    const match = row.quote_no.match(/TKF-\d{4}-(\d{4})/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

export function createQuotation(input: CreateQuotationInput, createdBy: string): Quotation {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const quoteNo = generateQuoteNo();

  const stmt = database.prepare(`
    INSERT INTO quotations (
      id, quote_no, customer_id, quote_date, valid_until,
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
    input.valid_until || null,
    input.transport_mode,
    input.service_type,
    input.origin_country,
    input.destination_country,
    input.pol || null,
    input.pod || null,
    input.incoterm,
    input.price,
    input.currency,
    input.price_note || null,
    input.status || 'Bekliyor',
    input.loss_reason || null,
    input.assigned_user_id,
    0,
    createdBy,
    now,
    now,
    null
  );

  return {
    id,
    quote_no: quoteNo,
    customer_id: input.customer_id,
    quote_date: input.quote_date,
    valid_until: input.valid_until || null,
    transport_mode: input.transport_mode,
    service_type: input.service_type,
    origin_country: input.origin_country,
    destination_country: input.destination_country,
    pol: input.pol || null,
    pod: input.pod || null,
    incoterm: input.incoterm,
    price: input.price,
    currency: input.currency,
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

export function getQuotationById(id: string): Quotation | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM quotations WHERE id = ? AND deleted_at IS NULL');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToQuotation(row) : null;
}

export function getQuotationByIdWithDetails(id: string): QuotationWithCustomer | null {
  const database = getDb();
  const stmt = database.prepare(`
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
    WHERE q.id = ? AND q.deleted_at IS NULL
  `);
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToQuotationWithCustomer(row) : null;
}

export function getAllQuotations(filters?: QuotationFilters): QuotationWithCustomer[] {
  const database = getDb();
  
  let whereClause = 'WHERE q.deleted_at IS NULL';
  const params: (string | number)[] = [];
  
  if (filters?.status) {
    whereClause += ' AND q.status = ?';
    params.push(filters.status);
  }
  
  if (filters?.customer_id) {
    whereClause += ' AND q.customer_id = ?';
    params.push(filters.customer_id);
  }
  
  if (filters?.assigned_user_id) {
    whereClause += ' AND q.assigned_user_id = ?';
    params.push(filters.assigned_user_id);
  }
  
  if (filters?.date_from) {
    whereClause += ' AND q.quote_date >= ?';
    params.push(filters.date_from);
  }
  
  if (filters?.date_to) {
    whereClause += ' AND q.quote_date <= ?';
    params.push(filters.date_to);
  }
  
  if (filters?.search) {
    whereClause += ` AND (
      q.quote_no LIKE ? OR 
      c.company_name LIKE ? OR
      c.contact_name LIKE ?
    )`;
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  
  const stmt = database.prepare(`
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
    ${whereClause}
    ORDER BY q.quote_date DESC, q.created_at DESC
  `);
  
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToQuotationWithCustomer);
}

export function updateQuotation(
  id: string, 
  input: UpdateQuotationInput, 
  incrementRevision: boolean = false
): Quotation | null {
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
  if (input.valid_until !== undefined) {
    sets.push('valid_until = ?');
    values.push(input.valid_until || null);
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
    values.push(input.price);
  }
  if (input.currency !== undefined) {
    sets.push('currency = ?');
    values.push(input.currency);
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
  if (incrementRevision) {
    sets.push('revision_count = revision_count + 1');
  }

  if (sets.length === 0) return getQuotationById(id);

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = database.prepare(`UPDATE quotations SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`);
  stmt.run(...values);

  return getQuotationById(id);
}

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

export function updateCustomerLastQuoteDate(customerId: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE customers 
    SET last_quote_date = ?, updated_at = ? 
    WHERE id = ?
  `);
  stmt.run(new Date().toISOString(), new Date().toISOString(), customerId);
}

function mapRowToQuotation(row: Record<string, unknown>): Quotation {
  return {
    id: row.id as string,
    quote_no: row.quote_no as string,
    customer_id: row.customer_id as string,
    quote_date: row.quote_date as string,
    valid_until: row.valid_until as string | null,
    transport_mode: row.transport_mode as Quotation['transport_mode'],
    service_type: row.service_type as Quotation['service_type'],
    origin_country: row.origin_country as string,
    destination_country: row.destination_country as string,
    pol: row.pol as string | null,
    pod: row.pod as string | null,
    incoterm: row.incoterm as Quotation['incoterm'],
    price: row.price as number,
    currency: row.currency as Quotation['currency'],
    price_note: row.price_note as string | null,
    status: row.status as Quotation['status'],
    loss_reason: row.loss_reason as Quotation['loss_reason'],
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