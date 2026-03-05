import type { User, CreateUserInput, UpdateUserInput, UserRole } from '@/types';
import DatabaseConstructor from 'better-sqlite3';
import bcrypt from 'bcryptjs';

// Lazy initialization of database
let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
    
    // Initialize users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
  return db;
}

export function createUser(input: CreateUserInput): User {
  const database = getDb();
  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(input.password, 10);
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, input.email, passwordHash, input.full_name, input.role, 1, now, now);

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

export function getAllUsers(): User[] {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToUser);
}

export function updateUser(id: string, input: UpdateUserInput): User | null {
  const database = getDb();
  const sets: string[] = [];
  const values: (string | number)[] = [];

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
    createUser({
      email: 'admin@nakliye.com',
      password: 'Admin123!',
      full_name: 'System Admin',
      role: 'admin',
    });
    console.log('Created initial admin user: admin@nakliye.com / Admin123!');
  }
}

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: row.full_name as string,
    role: row.role as UserRole,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
