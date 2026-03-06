import type { Activity, CreateActivityInput, UpdateActivityInput, ActivityWithUser } from '@/types/index.js';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeActivitiesTable();
  }
  return db;
}

function initializeActivitiesTable() {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER,
      notes TEXT NOT NULL,
      outcome TEXT NOT NULL,
      next_action_date TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id);
    CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
    CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
  `);
}

export function createActivity(input: CreateActivityInput, createdBy: string): Activity {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO activities (
      id, customer_id, type, date, duration, notes, outcome,
      next_action_date, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.customer_id,
    input.type,
    input.date,
    input.duration || null,
    input.notes,
    input.outcome,
    input.next_action_date || null,
    createdBy,
    now,
    now
  );

  return {
    id,
    customer_id: input.customer_id,
    type: input.type,
    date: input.date,
    duration: input.duration ?? null,
    notes: input.notes,
    outcome: input.outcome,
    next_action_date: input.next_action_date ?? null,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
}

export function getActivityById(id: string): Activity | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM activities WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToActivity(row) : null;
}

export function getActivityByIdWithUser(id: string): ActivityWithUser | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      a.*,
      u.full_name as created_by_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `);
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToActivityWithUser(row) : null;
}

export function getActivitiesByCustomer(customerId: string): ActivityWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      a.*,
      u.full_name as created_by_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.customer_id = ?
    ORDER BY a.date DESC, a.created_at DESC
  `);
  const rows = stmt.all(customerId) as Record<string, unknown>[];
  return rows.map(mapRowToActivityWithUser);
}

export function getRecentActivities(limit: number = 20): ActivityWithUser[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      a.*,
      u.full_name as created_by_name,
      c.company_name as customer_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN customers c ON a.customer_id = c.id
    ORDER BY a.date DESC, a.created_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit) as Record<string, unknown>[];
  return rows.map(row => ({
    ...mapRowToActivityWithUser(row),
    customer_name: row.customer_name as string,
  }));
}

export function getActivitiesNeedingFollowUp(userId?: string): ActivityWithUser[] {
  const database = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  let query = `
    SELECT 
      a.*,
      u.full_name as created_by_name,
      c.company_name as customer_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN customers c ON a.customer_id = c.id
    WHERE a.next_action_date <= ?
      AND a.outcome != 'Olumlu'
  `;
  
  if (userId) {
    query += ` AND a.created_by = ?`;
  }
  
  query += ` ORDER BY a.next_action_date ASC`;
  
  const stmt = database.prepare(query);
  const params = userId ? [today, userId] : [today];
  const rows = stmt.all(...params) as Record<string, unknown>[];
  
  return rows.map(row => ({
    ...mapRowToActivityWithUser(row),
    customer_name: row.customer_name as string,
  }));
}

export function updateActivity(id: string, input: UpdateActivityInput): Activity | null {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.type !== undefined) {
    sets.push('type = ?');
    values.push(input.type);
  }
  if (input.date !== undefined) {
    sets.push('date = ?');
    values.push(input.date);
  }
  if (input.duration !== undefined) {
    sets.push('duration = ?');
    values.push(input.duration ?? null);
  }
  if (input.notes !== undefined) {
    sets.push('notes = ?');
    values.push(input.notes);
  }
  if (input.outcome !== undefined) {
    sets.push('outcome = ?');
    values.push(input.outcome);
  }
  if (input.next_action_date !== undefined) {
    sets.push('next_action_date = ?');
    values.push(input.next_action_date ?? null);
  }

  if (sets.length === 0) return getActivityById(id);

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = database.prepare(`UPDATE activities SET ${sets.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getActivityById(id);
}

export function deleteActivity(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM activities WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function updateCustomerLastContactDate(customerId: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE customers 
    SET last_contact_date = ?
    WHERE id = ?
  `);
  stmt.run(new Date().toISOString(), customerId);
}

function mapRowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    customer_id: row.customer_id as string,
    type: row.type as Activity['type'],
    date: row.date as string,
    duration: row.duration as number | null,
    notes: row.notes as string,
    outcome: row.outcome as Activity['outcome'],
    next_action_date: row.next_action_date as string | null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapRowToActivityWithUser(row: Record<string, unknown>): ActivityWithUser {
  const activity = mapRowToActivity(row);
  return {
    ...activity,
    created_by_user: {
      id: activity.created_by,
      full_name: row.created_by_name as string,
    },
  };
}
