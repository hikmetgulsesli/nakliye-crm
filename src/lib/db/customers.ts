import type { Customer, CreateCustomerInput, UpdateCustomerInput, CustomerConflict, CustomerWithUser } from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeCustomersTable();
  }
  return db;
}

function initializeCustomersTable() {
  const database = db!;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT,
      transport_modes TEXT NOT NULL,
      service_types TEXT NOT NULL,
      incoterms TEXT NOT NULL,
      direction TEXT NOT NULL,
      origin_countries TEXT NOT NULL,
      destination_countries TEXT NOT NULL,
      source TEXT NOT NULL,
      potential TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_user_id TEXT NOT NULL,
      last_contact_date TEXT,
      last_quote_date TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create indexes for conflict detection
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_user_id);
  `);
}

export function createCustomer(input: CreateCustomerInput, createdBy: string): Customer {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO customers (
      id, company_name, contact_name, phone, email, address,
      transport_modes, service_types, incoterms, direction,
      origin_countries, destination_countries, source, potential,
      status, assigned_user_id, last_contact_date, last_quote_date,
      notes, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.company_name,
    input.contact_name,
    input.phone,
    input.email,
    input.address || null,
    JSON.stringify(input.transport_modes),
    JSON.stringify(input.service_types),
    JSON.stringify(input.incoterms),
    JSON.stringify(input.direction),
    JSON.stringify(input.origin_countries),
    JSON.stringify(input.destination_countries),
    input.source,
    input.potential,
    input.status,
    input.assigned_user_id,
    null,
    null,
    input.notes || null,
    createdBy,
    now,
    now
  );

  return {
    id,
    company_name: input.company_name,
    contact_name: input.contact_name,
    phone: input.phone,
    email: input.email,
    address: input.address || null,
    transport_modes: input.transport_modes,
    service_types: input.service_types,
    incoterms: input.incoterms,
    direction: input.direction,
    origin_countries: input.origin_countries,
    destination_countries: input.destination_countries,
    source: input.source,
    potential: input.potential,
    status: input.status,
    assigned_user_id: input.assigned_user_id,
    last_contact_date: null,
    last_quote_date: null,
    notes: input.notes || null,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
}

export function getCustomerById(id: string): Customer | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM customers WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToCustomer(row) : null;
}

export function getCustomerByIdWithUser(id: string): CustomerWithUser | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      c.*,
      au.full_name as assigned_user_name,
      cb.full_name as created_by_name
    FROM customers c
    LEFT JOIN users au ON c.assigned_user_id = au.id
    LEFT JOIN users cb ON c.created_by = cb.id
    WHERE c.id = ?
  `);
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToCustomerWithUser(row) : null;
}

export function getAllCustomers(): CustomerWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      c.*,
      au.full_name as assigned_user_name,
      cb.full_name as created_by_name
    FROM customers c
    LEFT JOIN users au ON c.assigned_user_id = au.id
    LEFT JOIN users cb ON c.created_by = cb.id
    ORDER BY c.created_at DESC
  `);
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToCustomerWithUser);
}

export function updateCustomer(id: string, input: UpdateCustomerInput): Customer | null {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (input.company_name !== undefined) {
    sets.push('company_name = ?');
    values.push(input.company_name);
  }
  if (input.contact_name !== undefined) {
    sets.push('contact_name = ?');
    values.push(input.contact_name);
  }
  if (input.phone !== undefined) {
    sets.push('phone = ?');
    values.push(input.phone);
  }
  if (input.email !== undefined) {
    sets.push('email = ?');
    values.push(input.email);
  }
  if (input.address !== undefined) {
    sets.push('address = ?');
    values.push(input.address || null);
  }
  if (input.transport_modes !== undefined) {
    sets.push('transport_modes = ?');
    values.push(JSON.stringify(input.transport_modes));
  }
  if (input.service_types !== undefined) {
    sets.push('service_types = ?');
    values.push(JSON.stringify(input.service_types));
  }
  if (input.incoterms !== undefined) {
    sets.push('incoterms = ?');
    values.push(JSON.stringify(input.incoterms));
  }
  if (input.direction !== undefined) {
    sets.push('direction = ?');
    values.push(JSON.stringify(input.direction));
  }
  if (input.origin_countries !== undefined) {
    sets.push('origin_countries = ?');
    values.push(JSON.stringify(input.origin_countries));
  }
  if (input.destination_countries !== undefined) {
    sets.push('destination_countries = ?');
    values.push(JSON.stringify(input.destination_countries));
  }
  if (input.source !== undefined) {
    sets.push('source = ?');
    values.push(input.source);
  }
  if (input.potential !== undefined) {
    sets.push('potential = ?');
    values.push(input.potential);
  }
  if (input.status !== undefined) {
    sets.push('status = ?');
    values.push(input.status);
  }
  if (input.assigned_user_id !== undefined) {
    sets.push('assigned_user_id = ?');
    values.push(input.assigned_user_id);
  }
  if (input.notes !== undefined) {
    sets.push('notes = ?');
    values.push(input.notes || null);
  }

  if (sets.length === 0) return getCustomerById(id);

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = database.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getCustomerById(id);
}

export function deleteCustomer(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM customers WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Update customer's last_quote_date
 */
export function updateCustomerLastQuoteDate(customerId: string, quoteDate: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE customers 
    SET last_quote_date = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(quoteDate, new Date().toISOString(), customerId);
}

export function checkConflicts(
  companyName: string,
  phone: string,
  email: string,
  excludeId?: string
): CustomerConflict[] {
  const database = getDb();
  const conflicts: CustomerConflict[] = [];

  // Check company name similarity
  let companyQuery = `
    SELECT id, company_name, contact_name, phone, email,
           'company_name' as matched_field,
           CASE 
             WHEN LOWER(company_name) = LOWER(?) THEN 100
             WHEN company_name LIKE ? THEN 80
             ELSE 50
           END as match_score
    FROM customers
    WHERE (
      LOWER(company_name) = LOWER(?) OR
      company_name LIKE ?
    )
  `;
  if (excludeId) {
    companyQuery += ' AND id != ?';
  }
  companyQuery += ' ORDER BY match_score DESC LIMIT 5';

  const companyStmt = database.prepare(companyQuery);
  const companyParams = excludeId 
    ? [companyName, `%${companyName}%`, companyName, `%${companyName}%`, excludeId]
    : [companyName, `%${companyName}%`, companyName, `%${companyName}%`];
  const companyRows = companyStmt.all(...companyParams) as Record<string, unknown>[];

  for (const row of companyRows) {
    conflicts.push({
      id: row.id as string,
      company_name: row.company_name as string,
      contact_name: row.contact_name as string,
      phone: row.phone as string,
      email: row.email as string,
      matched_field: row.matched_field as 'company_name',
      match_score: row.match_score as number,
    });
  }

  // Check phone
  let phoneQuery = `
    SELECT id, company_name, contact_name, phone, email,
           'phone' as matched_field,
           100 as match_score
    FROM customers
    WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', '') = 
          REPLACE(REPLACE(REPLACE(?, ' ', ''), '-', ''), '(', '')
  `;
  if (excludeId) {
    phoneQuery += ' AND id != ?';
  }

  const phoneStmt = database.prepare(phoneQuery);
  const phoneParams = excludeId ? [phone, excludeId] : [phone];
  const phoneRows = phoneStmt.all(...phoneParams) as Record<string, unknown>[];

  for (const row of phoneRows) {
    // Avoid duplicates
    if (!conflicts.find(c => c.id === row.id)) {
      conflicts.push({
        id: row.id as string,
        company_name: row.company_name as string,
        contact_name: row.contact_name as string,
        phone: row.phone as string,
        email: row.email as string,
        matched_field: row.matched_field as 'phone',
        match_score: row.match_score as number,
      });
    }
  }

  // Check email
  let emailQuery = `
    SELECT id, company_name, contact_name, phone, email,
           'email' as matched_field,
           100 as match_score
    FROM customers
    WHERE LOWER(email) = LOWER(?)
  `;
  if (excludeId) {
    emailQuery += ' AND id != ?';
  }

  const emailStmt = database.prepare(emailQuery);
  const emailParams = excludeId ? [email, excludeId] : [email];
  const emailRows = emailStmt.all(...emailParams) as Record<string, unknown>[];

  for (const row of emailRows) {
    if (!conflicts.find(c => c.id === row.id)) {
      conflicts.push({
        id: row.id as string,
        company_name: row.company_name as string,
        contact_name: row.contact_name as string,
        phone: row.phone as string,
        email: row.email as string,
        matched_field: row.matched_field as 'email',
        match_score: row.match_score as number,
      });
    }
  }

  return conflicts.sort((a, b) => b.match_score - a.match_score);
}

function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    company_name: row.company_name as string,
    contact_name: row.contact_name as string,
    phone: row.phone as string,
    email: row.email as string,
    address: row.address as string | null,
    transport_modes: JSON.parse(row.transport_modes as string),
    service_types: JSON.parse(row.service_types as string),
    incoterms: JSON.parse(row.incoterms as string),
    direction: JSON.parse(row.direction as string),
    origin_countries: JSON.parse(row.origin_countries as string),
    destination_countries: JSON.parse(row.destination_countries as string),
    source: row.source as Customer['source'],
    potential: row.potential as Customer['potential'],
    status: row.status as Customer['status'],
    assigned_user_id: row.assigned_user_id as string,
    last_contact_date: row.last_contact_date as string | null,
    last_quote_date: row.last_quote_date as string | null,
    notes: row.notes as string | null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapRowToCustomerWithUser(row: Record<string, unknown>): CustomerWithUser {
  const customer = mapRowToCustomer(row);
  return {
    ...customer,
    assigned_user: {
      id: customer.assigned_user_id,
      full_name: row.assigned_user_name as string,
    },
    created_by_user: {
      id: customer.created_by,
      full_name: row.created_by_name as string,
    },
  };
}
