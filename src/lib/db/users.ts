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
}
