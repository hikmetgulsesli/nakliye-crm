import type { User } from '@/types';
import DatabaseConstructor from 'better-sqlite3';
import { hash, compareSync, hashSync } from 'bcryptjs';

// Password validation for login
export function validatePassword(user: User & { password_hash?: string }, password: string): boolean {
  if (!user.password_hash) return false;
  return compareSync(password, user.password_hash);
}

// Seed initial admin user
export function seedInitialAdmin(): void {
  const database = getDb();
  const count = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (count.count === 0) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = hashSync('Admin123!', 12);
    
    database.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, 'admin@nakliye.com', passwordHash, 'System Admin', 'admin', now, now);
    
    console.log('Initial admin created: admin@nakliye.com / Admin123!');
  }
}

export interface UpdateUserInput {
  full_name?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}

export function updateUser(id: string, input: UpdateUserInput): User | null {
  const database = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  
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

export function deleteUser(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?');
  const result = stmt.run(new Date().toISOString(), id);
  return result.changes > 0;
}

let db: import('better-sqlite3').Database | null = null;

// Re-export getPool for compatibility
export function getPool() {
  return {
    query: async (sql: string, params?: unknown[]) => {
      const database = getDb();
      const stmt = database.prepare(sql.replace(/\$\d+/g, '?'));
      if (sql.trim().toLowerCase().startsWith('select')) {
        return { rows: stmt.all(...(params || [])) as Record<string, unknown>[] };
      }
      const result = stmt.run(...(params || []));
      return { rows: [] as Record<string, unknown>[], lastID: result.lastInsertRowid };
    }
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user';
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const database = getDb();
  const passwordHash = await hash(input.password, 12);
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const stmt = database.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  stmt.run(id, input.email.toLowerCase(), passwordHash, input.full_name, input.role, now, now);
  
  return {
    id,
    email: input.email.toLowerCase(),
    full_name: input.full_name,
    role: input.role,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    initializeUsersTable();
  }
  return db;
}

function initializeUsersTable() {
  const database = db!;
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);
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
  const row = stmt.get(email.toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapRowToUser(row) : null;
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
