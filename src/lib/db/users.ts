import type { User, CreateUserInput, UpdateUserInput } from '@/types';
import DatabaseConstructor from 'better-sqlite3';
import bcrypt from 'bcryptjs';

let db: import('better-sqlite3').Database | null = null;

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

export function getAllUsersIncludingInactive(): User[] {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users ORDER BY full_name ASC');
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

export function createUser(input: CreateUserInput): User {
  const database = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(input.password, 10);

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

export function deleteUser(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function validatePassword(user: User, password: string): boolean {
  const database = getDb();
  const stmt = database.prepare('SELECT password_hash FROM users WHERE id = ?');
  const row = stmt.get(user.id) as { password_hash: string } | undefined;
  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}

export function seedInitialAdmin(): void {
  const existing = getUserByEmail('admin@nakliye.com');
  if (!existing) {
    // Use environment variable for admin password
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_INITIAL_PASSWORD environment variable is required for initial admin setup');
    }
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    createUser({
      email: 'admin@nakliye.com',
      password: hashedPassword,
      full_name: 'System Admin',
      role: 'admin',
    });
  }
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
