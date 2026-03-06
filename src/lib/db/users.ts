import type { User, UpdateUserInput, CreateUserInput } from '@/types';
import DatabaseConstructor from 'better-sqlite3';

let db: import('better-sqlite3').Database | null = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/crm.db';
    db = new DatabaseConstructor(dbPath);
  }
  return db;
}

export function getAllUsers(): User[] {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY full_name ASC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToUser);
}

interface GetUsersOptions {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getUsers(options: GetUsersOptions = {}): PaginatedUsers {
  const database = getDb();
  const { page = 1, limit = 10, includeInactive = false } = options;
  const offset = (page - 1) * limit;

  // Get total count
  const countStmt = database.prepare(
    includeInactive 
      ? 'SELECT COUNT(*) as count FROM users'
      : 'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
  );
  const { count } = countStmt.get() as { count: number };

  // Get users
  const stmt = database.prepare(
    includeInactive
      ? 'SELECT * FROM users ORDER BY full_name ASC LIMIT ? OFFSET ?'
      : 'SELECT * FROM users WHERE is_active = 1 ORDER BY full_name ASC LIMIT ? OFFSET ?'
  );
  const rows = stmt.all(limit, offset) as Record<string, unknown>[];

  return {
    data: rows.map(mapRowToUser),
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

interface CreateUserData extends CreateUserInput {
  password_hash: string;
}

export function createUser(data: CreateUserData): User {
  const database = getDb();
  const stmt = database.prepare(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?)`
  );
  
  const result = stmt.run(
    data.email,
    data.password_hash,
    data.full_name,
    data.role || 'user',
    1
  );
  
  const user = getUserById(result.lastInsertRowid.toString());
  if (!user) {
    throw new Error('Failed to create user');
  }
  
  return user;
}

export function softDeleteUser(id: string): boolean {
  const database = getDb();
  const stmt = database.prepare(
    'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const result = stmt.run(id);
  return result.changes > 0;
}

export function getUserById(id: string): User | null {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToUser(row) : null;
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
