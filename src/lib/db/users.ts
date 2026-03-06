<<<<<<< HEAD
import { Pool } from 'pg';
import { User, CreateUserInput, UpdateUserInput, PaginatedResponse, PaginationParams } from '@/types';

// Database connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

// User database operations
export async function getUsers(
  params: PaginationParams
): Promise<PaginatedResponse<User>> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const pool = getPool();
  
  const [countResult, dataResult] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query(
      `SELECT id, email, full_name, role, is_active, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  const users = dataResult.rows.map(row => ({
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }));

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at, updated_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at, updated_at 
     FROM users 
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function createUser(
  input: CreateUserInput & { password_hash: string }
): Promise<User> {
  const pool = getPool();
  const { email, full_name, password_hash, role } = input;

  const result = await pool.query(
    `INSERT INTO users (email, full_name, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, email, full_name, role, is_active, created_at, updated_at`,
    [email, full_name, password_hash, role]
  );

  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<User | null> {
  const pool = getPool();
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (input.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(input.email);
  }
  if (input.full_name !== undefined) {
    updates.push(`full_name = $${paramCount++}`);
    values.push(input.full_name);
  }
  if (input.role !== undefined) {
    updates.push(`role = $${paramCount++}`);
    values.push(input.role);
  }
  if (input.is_active !== undefined) {
    updates.push(`is_active = $${paramCount++}`);
    values.push(input.is_active);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE users 
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramCount}
     RETURNING id, email, full_name, role, is_active, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function softDeleteUser(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users 
     SET is_active = false, updated_at = NOW()
     WHERE id = $1`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getUserCount(): Promise<number> {
  const pool = getPool();
  const result = await pool.query('SELECT COUNT(*) FROM users');
  return parseInt(result.rows[0].count, 10);
=======
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
>>>>>>> origin/feature/crm-core-modules
}
