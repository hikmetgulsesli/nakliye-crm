import type { User, UpdateUserInput } from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
  }
  return db;
}

// PostgreSQL-style pool compatibility layer for API routes
export function getPool() {
  return {
    query: async (sql: string, params?: (string | number | boolean | null | Date)[]) => {
      const database = getDb();
      // Convert PostgreSQL $1, $2... to SQLite ?, ?, ...
      const sqliteSql = sql.replace(/\$(\d+)/g, '?');
      const stmt = database.prepare(sqliteSql);
      const rows = params ? (stmt.all(...params) as Record<string, unknown>[]) : (stmt.all() as Record<string, unknown>[]);
      return { rows };
    },
  };
}

export async function getUsers({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}): Promise<{ users: User[]; total: number; page: number; limit: number }> {
  const database = getDb();
  const offset = (page - 1) * limit;
  
  // Get total count
  const countStmt = database.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
  const { count } = countStmt.get() as { count: number };
  
  // Get paginated users
  const stmt = database.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY full_name ASC LIMIT ? OFFSET ?');
  const rows = stmt.all(limit, offset) as Record<string, unknown>[];
  
  return {
    users: rows.map(mapRowToUser),
    total: count,
    page,
    limit,
  };
}

export function getAllUsers(): User[] {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY full_name ASC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToUser);
}

export function getUserById(id: string): User | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
  const row = stmt.get(email) as Record<string, unknown> | undefined;
  return row ? mapRowToUser(row) : null;
}

export function createUser(input: {
  email: string;
  password_hash: string;
  full_name: string;
  role: User['role'];
}): User {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const stmt = database.prepare(
    'INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, input.email, input.password_hash, input.full_name, input.role, 1, now, now);
  
  return {
    id,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function updateUser(id: string, input: UpdateUserInput): User | null {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | boolean | number)[] = [];

  if (input.full_name !== undefined) {
    sets.push('full_name = ?');
    values.push(input.full_name);
  }
  if (input.role !== undefined) {
    sets.push('role = ?');
    values.push(input.role);
  }
  if (input.is_active !== undefined) {
    sets.push('is_active = ?');
    values.push(input.is_active ? 1 : 0);
  }

  if (sets.length === 0) return getUserById(id);

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = database.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getUserById(id);
}

export function softDeleteUser(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?');
  const result = stmt.run(new Date().toISOString(), id);
  return result.changes > 0;
}

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: row.full_name as string,
    role: row.role as User['role'],
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
