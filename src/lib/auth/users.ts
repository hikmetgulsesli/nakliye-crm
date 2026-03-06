import { compare, hash } from "bcryptjs";
import { getPool } from "@/lib/db/users";
import type { User } from "@/types/index";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = true",
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    id: row.id.toString(),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1 AND is_active = true",
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    id: row.id.toString(),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: "admin" | "user";
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const pool = getPool();
  const passwordHash = await hashPassword(input.password);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email, passwordHash, input.fullName, input.role ?? "user"]
  );

  const row = result.rows[0];
  return {
    ...row,
    id: row.id.toString(),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Şifre en az 8 karakter olmalıdır" };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Şifre en az 1 özel karakter içermelidir" };
  }

  return { valid: true };
}
